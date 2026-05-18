export class APIHelper {
  constructor(request) {
    this.request = request;
    this.baseUrl = 'http://localhost:3000';
  }

  async adminLogin() {
    const res = await this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { username: 'admin_root', password: '1234' }
    });
    if(!res.ok()) throw new Error('API admin login failed');
    const body = await res.json();
    return { token: body.data.token, user: body.data.user };
  }

  async createEvent(adminToken, name, slug) {
    const res = await this.request.post(`${this.baseUrl}/api/events`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { name, slug, start_date: new Date().toISOString(), end_date: new Date().toISOString() }
    });
    if(!res.ok()) {
        const text = await res.text();
        if(text.includes('Unique') || text.includes('Duplicate')) {
            const fetchRes = await this.request.get(`${this.baseUrl}/api/events`, {
               headers: { Authorization: `Bearer ${adminToken}` }
            });
            const eventsBody = await fetchRes.json();
            const events = eventsBody.data || eventsBody;
            return events.find(e => e.slug === slug);
        }
        throw new Error(`Create event failed: ${text}`);
    }
    const body = await res.json();
    return body.data || body;
  }

  async assignRole(adminToken, userId, eventId, role) {
    const res = await this.request.post(`${this.baseUrl}/api/users/roles/assign`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { userId: Number(userId), eventId: Number(eventId), role }
    });
    if(!res.ok()) throw new Error(`Role assignment failed: ${await res.text()}`);
    const body = await res.json();
    return body.data || body;
  }
  
  async getUserMe(userToken) {
    const res = await this.request.get(`${this.baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if(!res.ok()) throw new Error(`Auth me failed`);
    const body = await res.json();
    return body.data || body;
  }
}
