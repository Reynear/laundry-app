import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock database before importing the auth module
const mockDb = {
	select: mock(() => mockDb),
	from: mock(() => mockDb),
	where: mock(() => mockDb),
	limit: mock(() => []),
	insert: mock(() => mockDb),
	values: mock((_data?: unknown) => mockDb),
};

// Mock the database module
mock.module("../db", () => ({ db: mockDb }));

// Import after mocking
import auth from "../features/auth/api";

describe("Auth API", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		mockDb.select.mockClear();
		mockDb.from.mockClear();
		mockDb.where.mockClear();
		mockDb.limit.mockClear();
		mockDb.insert.mockClear();
		mockDb.values.mockClear();
	});

	describe("Login", () => {
		it("should login successfully with valid credentials", async () => {
			const passwordHash = await Bun.password.hash("user123");

			mockDb.limit.mockReturnValue([
				{
					id: 1,
					email: "user@mymona.uwi.edu",
					passwordHash,
					role: "student",
				},
			]);

			const formData = new FormData();
			formData.append("email", "user@mymona.uwi.edu");
			formData.append("password", "user123");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe("Redirecting...");
			expect(res.headers.get("HX-Redirect")).toBe(
				"/dashboard?toast=login_success",
			);
			expect(res.headers.get("Set-Cookie")).toContain("sessionId");
		});

		it("should login successfully as staff and redirect to appointments", async () => {
			const passwordHash = await Bun.password.hash("staff123");

			mockDb.limit.mockReturnValue([
				{
					id: 2,
					email: "staff@mymona.uwi.edu",
					passwordHash,
					role: "staff",
				},
			]);

			const formData = new FormData();
			formData.append("email", "staff@mymona.uwi.edu");
			formData.append("password", "staff123");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe("Redirecting...");
			expect(res.headers.get("HX-Redirect")).toBe(
				"/appointments?toast=login_success",
			);
			expect(res.headers.get("Set-Cookie")).toContain("sessionId");
		});

		it("should fail login with invalid password", async () => {
			const passwordHash = await Bun.password.hash("user123");

			mockDb.limit.mockReturnValue([
				{
					id: 1,
					email: "user@mymona.uwi.edu",
					passwordHash,
					role: "student",
				},
			]);

			const formData = new FormData();
			formData.append("email", "user@mymona.uwi.edu");
			formData.append("password", "wrongpassword");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Login Failed");
			expect(res.headers.get("Set-Cookie")).toBeNull();
		});

		it("should fail login with non-existent user", async () => {
			mockDb.limit.mockReturnValue([]);

			const formData = new FormData();
			formData.append("email", "nonexistent@example.com");
			formData.append("password", "password123");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Login Failed");
		});

		it("should fail login with missing email", async () => {
			const formData = new FormData();
			formData.append("password", "password123");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Login Failed");
		});

		it("should fail login with missing password", async () => {
			const formData = new FormData();
			formData.append("email", "user@example.com");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Login Failed");
		});

		it("should set correct cookie attributes on successful login", async () => {
			const passwordHash = await Bun.password.hash("user123");

			mockDb.limit.mockReturnValue([
				{
					id: 1,
					email: "user@mymona.uwi.edu",
					passwordHash,
					role: "student",
				},
			]);

			const formData = new FormData();
			formData.append("email", "user@mymona.uwi.edu");
			formData.append("password", "user123");

			const req = new Request("http://localhost/login", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			const setCookie = res.headers.get("Set-Cookie");

			expect(setCookie).toContain("HttpOnly");
			expect(setCookie).toContain("Secure");
			expect(setCookie).toContain("SameSite=Strict");
			expect(setCookie).toContain("Path=/");
		});
	});

	describe("Registration", () => {
		it("should register a new user successfully", async () => {
			let callCount = 0;
			mockDb.limit.mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return []; // No existing user
				} else {
					return [
						{
							id: 2,
							email: "newuser@example.com",
							firstName: "Test",
							lastName: "User",
							role: "student",
						},
					];
				}
			});

			const email = "newuser@example.com";
			const formData = new FormData();
			formData.append("email", email);
			formData.append("password", "password123");
			formData.append("firstName", "Test");
			formData.append("lastName", "User");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			expect(await res.text()).toBe("Redirecting...");
			expect(res.headers.get("HX-Redirect")).toBe("/dashboard?toast=welcome");
			expect(res.headers.get("Set-Cookie")).toContain("sessionId");
		});

		it("should fail registration if user already exists", async () => {
			mockDb.limit.mockReturnValue([
				{
					id: 1,
					email: "user@mymona.uwi.edu",
					role: "student",
				},
			]);

			const formData = new FormData();
			formData.append("email", "user@mymona.uwi.edu");
			formData.append("password", "password123");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("User already exists");
		});

		it("should fail registration with missing email", async () => {
			const formData = new FormData();
			formData.append("password", "password123");
			formData.append("firstName", "Test");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Email and password are required");
		});

		it("should fail registration with missing password", async () => {
			const formData = new FormData();
			formData.append("email", "user@example.com");
			formData.append("firstName", "Test");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			const res = await auth.request(req);
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain("Email and password are required");
		});

		it("should hash password before storing", async () => {
			let insertedPassword = "";
			mockDb.limit.mockImplementation(() => []); // No existing user
			mockDb.values.mockImplementation((data) => {
				insertedPassword = (data as { passwordHash: string }).passwordHash;
				return mockDb;
			});

			// Mock the fetch after insert
			mockDb.limit.mockReturnValueOnce([]).mockReturnValueOnce([
				{
					id: 2,
					email: "newuser@example.com",
					passwordHash: insertedPassword,
				},
			]);

			const formData = new FormData();
			formData.append("email", "newuser@example.com");
			formData.append("password", "plaintext");
			formData.append("firstName", "Test");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			await auth.request(req);

			// Password should be hashed, not plaintext
			expect(insertedPassword).not.toBe("plaintext");
			expect(insertedPassword.length).toBeGreaterThan(20); // Hashed passwords are long
		});

		it("should register user with optional hallId", async () => {
			let insertedData: Record<string, unknown> = {};
			mockDb.limit.mockImplementation(() => []); // No existing user
			mockDb.values.mockImplementation((data) => {
				insertedData = data as Record<string, unknown>;
				return mockDb;
			});

			mockDb.limit.mockReturnValueOnce([]).mockReturnValueOnce([
				{
					id: 2,
					email: "newuser@example.com",
					hallId: 5,
				},
			]);

			const formData = new FormData();
			formData.append("email", "newuser@example.com");
			formData.append("password", "password123");
			formData.append("firstName", "Test");
			formData.append("hallId", "5");

			const req = new Request("http://localhost/register", {
				method: "POST",
				body: formData,
			});

			await auth.request(req);
			expect(insertedData.hallId).toBe(5);
		});
	});

	describe("Logout", () => {
		it("should logout successfully", async () => {
			const req = new Request("http://localhost/logout", {
				method: "POST",
			});

			const res = await auth.request(req);
			expect(res.status).toBe(302);
			expect(res.headers.get("Location")).toBe("/login");
			const setCookie = res.headers.get("Set-Cookie");
			expect(setCookie).toBeTruthy();
			expect(setCookie).toContain("sessionId=");
		});

		it("should clear session cookie on logout", async () => {
			const req = new Request("http://localhost/logout", {
				method: "POST",
				headers: {
					Cookie: "sessionId=test-session-id",
				},
			});

			const res = await auth.request(req);
			expect(res.status).toBe(302);
			const setCookie = res.headers.get("Set-Cookie");
			expect(setCookie).toBeTruthy();
		});
	});

	describe("Clear Alert", () => {
		it("should return empty alert slot", async () => {
			const req = new Request("http://localhost/login/clear-alert");
			const res = await auth.request(req);

			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toContain('id="alert-slot"');
		});
	});
});
