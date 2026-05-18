export class RegisterPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByLabel(/usuario|username|nombre/i).or(page.locator('input[type="text"]').first());
    this.emailInput = page.getByLabel(/email|correo/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/contraseña|password|clave/i).or(page.locator('input[type="password"]'));
    this.registerButton = page.getByRole('button', { name: /completar registro|crear cuenta|registrar/i });
    // Alternativa al link de ir a registro
    this.goToRegisterLink = page.getByRole('button', { name: /registrarse|crear cuenta/i });
  }

  async goto() {
    // Si la ruta directa falla, podríamos navegar por UI
    const res = await this.page.goto('/register');
    if (res && res.status() === 404) {
        await this.page.goto('/login');
        await this.goToRegisterLink.click();
    }
  }

  async register(username, email, password) {
    await this.usernameInput.fill(username);
    if(await this.emailInput.isVisible()) {
       await this.emailInput.fill(email);
    }
    await this.passwordInput.fill(password);
    await this.registerButton.click();
    
    // Esperamos a que la UI muestre el mensaje de éxito antes de que redireccione
    await this.page.getByText(/Cuenta creada/i).waitFor({ state: 'visible' });
  }
}
