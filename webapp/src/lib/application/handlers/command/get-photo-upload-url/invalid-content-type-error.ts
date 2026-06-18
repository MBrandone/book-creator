export class InvalidContentTypeError extends Error {
  constructor(contentType: string) {
    super(`Invalid content type: ${contentType}. Allowed types: image/jpeg, image/png, image/gif, image/webp`);
    this.name = 'InvalidContentTypeError';
  }
}
