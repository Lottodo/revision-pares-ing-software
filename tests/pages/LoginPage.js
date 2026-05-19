export class LoginPage {
  constructor(page) {
    this.page = page;
    // Utilizamos selectores robustos orientados a accesibilidad
    this.usernameInput = page.getByLabel(/usuario|username/i).or(page.locator('input[type="text"]'));
    this.passwordInput = page.getByLabel(/contraseña|password|clave/i).or(page.locator('input[type="password"]'));
    this.loginButton = page.getByRole('button', { name: /ingresar|entrar|iniciar/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(/.*(dashboard|author|select-event|editor|admin|reviewer)/);
  }
}
