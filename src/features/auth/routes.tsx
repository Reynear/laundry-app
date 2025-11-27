import { Hono } from "hono";
import { BaseLayout } from "../../layouts";
import { LoginScreen, RegisterScreen } from "../../pages/client/AuthScreens";
import { hallRepository } from "../../Repositories";

const app = new Hono();

app.get("/login", (c) => {
	return c.html(
		<BaseLayout title="Login">
			<LoginScreen />
		</BaseLayout>,
	);
});

app.get("/signup", async (c) => {
	const halls = await hallRepository.getAllHalls();
	return c.html(
		<BaseLayout title="Signup">
			<RegisterScreen halls={halls} />
		</BaseLayout>,
	);
});

export default app;
