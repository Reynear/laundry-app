
export function LoginScreen() {
 return(
    <main class="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <form
        id="loginForm"
        hx-post="/login"
        hx-target="#loginForm"
        hx-swap="outerHTML"
        class="w-full max-w-sm space-y-5 bg-white border border-gray-200 p-8 rounded-xl shadow-sm"
      >
        <header class="text-center">
          <div class="flex flex-col items-center gap-3 mb-1">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-2xl">C</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">CleanPay</h1>
          </div>
          <p class="text-sm text-gray-500">
            Sign in to manage your laundry bookings
          </p>
        </header>

        <Input id="email" type="email" label="Email" placeholder="youremail@mymona.uwi.edu" />
        <Input id="password" type="password" label="Password" placeholder="Enter your password" />

        <Credentials />

        <button
          type="submit"
          class="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Sign in
        </button>

        <p class="text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" class="text-blue-600 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </form>
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
        class="w-full max-w-sm space-y-5 bg-white border border-gray-200 p-8 rounded-xl shadow-sm"
      >
        {/* Header */}
        <header class="text-center">
          <div class="w-12 h-12 mx-auto mb-2 bg-black rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-2xl">C</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">CleanPay</h1>
          <p class="text-sm text-gray-500">Create your account</p>
        </header>

        {/* Inputs */}
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
          ]} // TODO: Populate from the database
        />

        <Select
          id="notificationMethod"
          label="Preferred Notification Method"
          options={[
            ["", "Select notification method"],
            ["push", "Push Notification"],
            ["email", "Email"],
            ["sms", "SMS"],
          ]} // TODO: Populate from the database
        />

        {/* Submit */}
        <button
          type="submit"
          class="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Sign up
        </button>

        {/* Footer */}
        <p class="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" class="text-blue-600 font-medium hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}

function Input({ id, type, label, placeholder }: any) {
  return (
    <label class="block text-sm text-gray-700 font-medium space-y-2">
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </label>
  );
}

function Credentials() {
  return (
    <section class="p-3 border border-gray-200 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-2">
      <p class="font-semibold text-gray-700">Default Logins:</p>
      <p>User → user@mymona.uwi.edu / user123</p>
      <p>Staff → staff@mymona.uwi.edu / staff123</p>
    </section>
  );
}

function Select({ id, label, options }: any) {
  return (
    <label class="block text-sm font-medium text-gray-700 space-y-2">
      <span>{label}</span>
      <select
        id={id}
        name={id}
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
      >
        {options.map(([value, text]: [string, string]) => (
          <option value={value}>{text}</option>
        ))}
      </select>
    </label>
  );
}