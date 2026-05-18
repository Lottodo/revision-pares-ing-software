export class ReviewPage {
  constructor(page) {
    this.page = page;
    this.scoreInput = page.getByLabel(/puntaje|score/i);
    this.commentsInput = page.getByLabel(/comentarios|comments/i);
    this.submitButton = page.getByRole('button', { name: /enviar revisión|submit review/i });
  }

  async submitReview(score, comments) {
    if (score) await this.scoreInput.fill(score.toString());
    if (comments) await this.commentsInput.fill(comments);
    await this.submitButton.click();
  }
}
