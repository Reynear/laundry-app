import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { BaseLayout, DashboardLayout } from './layouts'
import { LoginScreen, RegisterScreen } from './pages/AuthScreens'
import  auth  from './features/auth/api'

const app = new Hono()

// Serve CSS file
app.use('/output.css', serveStatic({ path: './src/output.css' }))

app.route('/api', auth)

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
  
  const toastParam = c.req.query('toast')
  const showSuccessToast = toastParam === 'login_success'
  
  return c.html(
    <DashboardLayout title="Dashboard" user={user}></DashboardLayout>
  )
})

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
