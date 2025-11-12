import { Alert } from "../components/Alert";
import { BrandLogo } from "../components/BrandLogo";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";

export function LoginForm({ error, email }: { error?: string, email?: string } = {}) {
  return (
    <form
      id="loginForm"
      hx-post="/api/login"
      hx-target="#alert-slot"
      hx-swap="outerHTML"
      class="w-full max-w-sm space-y-6 bg-white border border-gray-200 p-8 rounded-xl shadow-sm"
    >
      <header class="text-center space-y-1">
        <BrandLogo variant="auth" />
        <p class="text-base text-gray-600">
          Sign in to manage your laundry bookings
        </p>
      </header>

      <div id="alert-slot"></div>

      <Input id="email" type="email" label="Email" placeholder="youremail@mymona.uwi.edu" value={email || ""} />
      <Input id="password" type="password" label="Password" placeholder="Enter your password" />

      <Credentials />

      <Button type="submit">Sign in</Button>
      <p class="text-center text-base text-gray-600">
        Don’t have an account?{' '}
        <a href="/signup" class="text-blue-600 font-medium hover:underline">
          Sign up
        </a>
      </p>
    </form>
  )
}

export function LoginScreen({ error }: { error?: string } = {}) {
  return (
    <main class="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <LoginForm error={error} />
    </main>
  );
}

export function RegisterScreen() {
  return (
    <main class="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <form
        id="signupForm"
        hx-post="/register"
        hx-target="#signupForm"
        hx-swap="outerHTML"
        class="w-full max-w-sm space-y-6 bg-white border border-gray-200 p-8 rounded-xl shadow-sm"
      >
        <header class="text-center space-y-1">
          <BrandLogo variant="auth" />
          <p class="text-base text-gray-600">Create your account</p>
        </header>

        <Input id="email" type="email" label="Student Email" placeholder="youremail@mymona.uwi.edu" />
        <Input id="firstName" type="text" label="First Name" placeholder="Enter your first name" />
        <Input id="lastName" type="text" label="Last Name" placeholder="Enter your last name" />

        <Select
          id="hallOfResidence"
          label="Hall of Residence"
          options={[
            ["", "Select your hall"],
            ["chancellor", "Chancellor Hall"],
            ["irvine", "Irvine Hall"],
            ["rex-nettleford", "Rex Nettleford Hall"],
            ["mary-seacole", "Mary Seacole Hall"],
            ["taylor", "Taylor Hall"],
            ["other", "Other"],
          ]}
        />

        <Select
          id="notificationMethod"
          label="Preferred Notification Method"
          options={[
            ["", "Select notification method"],
            ["push", "Push Notification"],
            ["email", "Email"],
            ["sms", "SMS"],
          ]}
        />

        <Button type="submit">Sign up</Button>

        <p class="text-center text-base text-gray-600">
          Already have an account?{' '}
          <a href="/login" class="text-blue-600 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}

function Credentials() {
  return (
    <section class="p-4 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
      <p class="font-semibold text-gray-700">Default Logins:</p>
      <p>User → user@mymona.uwi.edu / user123</p>
      <p>Staff → staff@mymona.uwi.edu / staff123</p>
    </section>
  );
}

