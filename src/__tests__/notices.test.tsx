import { describe, expect, it, beforeEach, mock } from "bun:test";
import { Hono } from "hono";
import noticesApp from "../features/notices/routes";

// Mock Repositories
const mockNoticeRepository = {
  getActiveNotices: mock(),
  createNotice: mock(),
  getNoticeById: mock(),
  updateNotice: mock(),
  deleteNotice: mock(),
};

const mockHallRepository = {
  getAllHalls: mock(),
};

// Mock the module
mock.module("../Repositories", () => ({
  noticeRepository: mockNoticeRepository,
  hallRepository: mockHallRepository,
}));

describe("Staff Notices API", () => {
  let app: Hono;
  const staffUser = {
    id: 1,
    role: "staff",
    hallId: 1,
    hallName: "Chancellor Hall",
    email: "staff@example.com",
    firstName: "Staff",
    lastName: "User",
  };

  beforeEach(() => {
    // Reset mocks
    mockNoticeRepository.getActiveNotices.mockClear();
    mockNoticeRepository.createNotice.mockClear();
    mockNoticeRepository.getNoticeById.mockClear();
    mockNoticeRepository.updateNotice.mockClear();
    mockNoticeRepository.deleteNotice.mockClear();
    mockHallRepository.getAllHalls.mockClear();

    // Setup test app with user context
    app = new Hono();
    app.use("*", async (c, next) => {
      c.set("user", staffUser);
      await next();
    });
    app.route("/notices", noticesApp);
  });

  describe("GET /notices", () => {
    it("should return staff notices page with notices for their hall", async () => {
      const mockNotices = [
        {
          id: 1,
          title: "Test Notice",
          content: "Content",
          type: "info",
          hallId: 1,
          publishedAt: new Date(),
        },
      ];
      mockNoticeRepository.getActiveNotices.mockResolvedValue(mockNotices);

      const req = new Request("http://localhost/notices");
      const res = await app.request(req);

      expect(res.status).toBe(200);
      expect(mockNoticeRepository.getActiveNotices).toHaveBeenCalledWith(1, false);
      const text = await res.text();
      expect(text).toContain("Test Notice");
      expect(text).toContain("Manage notices for Chancellor Hall");
    });
  });

  describe("POST /notices", () => {
    it("should create a new notice for the staff's hall", async () => {
      mockNoticeRepository.createNotice.mockResolvedValue({ id: 2 });

      const formData = new FormData();
      formData.append("title", "New Notice");
      formData.append("content", "New Content");
      formData.append("priority", "info");

      const req = new Request("http://localhost/notices", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);

      expect(res.status).toBe(302); // Redirect
      expect(res.headers.get("Location")).toBe("/notices");
      expect(mockNoticeRepository.createNotice).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Notice",
          content: "New Content",
          type: "info",
          hallId: 1,
          authorUserId: 1,
        })
      );
    });

    it("should create an urgent notice correctly", async () => {
      mockNoticeRepository.createNotice.mockResolvedValue({ id: 3 });

      const formData = new FormData();
      formData.append("title", "Urgent Notice");
      formData.append("content", "Urgent Content");
      formData.append("priority", "urgent");

      const req = new Request("http://localhost/notices", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);

      expect(res.status).toBe(302);
      expect(mockNoticeRepository.createNotice).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Urgent Notice",
          type: "alert",
        })
      );
    });
  });

  describe("GET /notices/:id/edit", () => {
    it("should return edit form for own hall notice", async () => {
      const mockNotice = {
        id: 1,
        title: "Existing Notice",
        content: "Content",
        type: "info",
        hallId: 1,
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockNotice);

      const req = new Request("http://localhost/notices/1/edit");
      const res = await app.request(req);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("Edit Notice");
      expect(text).toContain("Existing Notice");
    });

    it("should return 403 for other hall notice", async () => {
      const mockNotice = {
        id: 2,
        title: "Other Hall Notice",
        content: "Content",
        type: "info",
        hallId: 2, // Different hall
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockNotice);

      const req = new Request("http://localhost/notices/2/edit");
      const res = await app.request(req);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /notices/:id (PUT)", () => {
    it("should update notice", async () => {
      const mockNotice = {
        id: 1,
        title: "Old Title",
        hallId: 1,
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockNotice);
      mockNoticeRepository.updateNotice.mockResolvedValue(true);

      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("title", "Updated Title");
      formData.append("content", "Updated Content");
      formData.append("priority", "info");

      const req = new Request("http://localhost/notices/1", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);

      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("/notices");
      expect(mockNoticeRepository.updateNotice).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: "Updated Title",
          content: "Updated Content",
        })
      );
    });
  });

  describe("DELETE /notices/:id", () => {
    it("should delete notice", async () => {
      const mockNotice = {
        id: 1,
        hallId: 1,
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockNotice);
      mockNoticeRepository.deleteNotice.mockResolvedValue(true);

      const req = new Request("http://localhost/notices/1", {
        method: "DELETE",
      });

      const res = await app.request(req);

      expect(res.status).toBe(200);
      expect(mockNoticeRepository.deleteNotice).toHaveBeenCalledWith(1);
    });

    it("should return 403 if deleting notice from another hall", async () => {
      const mockNotice = {
        id: 2,
        hallId: 2, // Different hall
      };
      mockNoticeRepository.getNoticeById.mockResolvedValue(mockNotice);

      const req = new Request("http://localhost/notices/2", {
        method: "DELETE",
      });

      const res = await app.request(req);

      expect(res.status).toBe(403);
      expect(mockNoticeRepository.deleteNotice).not.toHaveBeenCalled();
    });
  });
});
