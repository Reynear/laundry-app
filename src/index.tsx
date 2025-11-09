import { Hono } from 'hono'
import { BaseLayout, DashboardLayout } from './layouts'
import { LoginScreen, RegisterScreen } from './pages/AuthScreens'

const app = new Hono()

app.get('/', (c) => {
  if (true) { // TODO: replace with actual authentication check
    return c.redirect('/dashboard')
  }
  else {
    return c.redirect('/login')
  }
})

app.get('/dashboard', (c) => {
  const user: User = {
    id: "1",
    email: "test@test.com",
    firstName: "Test",
    lastName: "User",
    hallOfResidence: "Chancellor Hall",
    role: "user"
  }
  return c.html(<DashboardLayout title="Dashboard" user={user} />)})

app.get('/login', (c) => {
  return c.html(
    <BaseLayout title="Login">
      <LoginScreen />
    </BaseLayout>
  )
})

app.get('/signup', (c) => {
  return c.html(
    <BaseLayout title="Signup">
      <RegisterScreen />
    </BaseLayout>
  )
})

export default app
