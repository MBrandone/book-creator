import { CharacterRepository } from '@/lib/domain/character-repository';
import { CharacterPhotoRepository } from '@/lib/domain/character-photo-repository';
import { Storage } from '@/lib/storage/storage';
import { CharacterNotFoundError } from './character-not-found-error';
import { InvalidContentTypeError } from './invalid-content-type-error';

export interface GetPhotoUploadUrlCommand {
  characterId: string;
  contentType: string;
}

export interface GetPhotoUploadUrlResult {
  uploadUrl: string;
  photoUrl: string;
  storageKey: string;
  expiresIn: number;
}

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const UPLOAD_URL_EXPIRY_SECONDS = 900;

export class GetPhotoUploadUrlCommandHandler {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly characterPhotoRepository: CharacterPhotoRepository,
    private readonly storage: Storage
  ) {}

  async execute(command: GetPhotoUploadUrlCommand): Promise<GetPhotoUploadUrlResult> {
    const characterExists = await this.characterRepository.existsById(command.characterId);
    if (!characterExists) {
      throw new CharacterNotFoundError(command.characterId);
    }

    if (!ALLOWED_CONTENT_TYPES.includes(command.contentType)) {
      throw new InvalidContentTypeError(command.contentType);
    }

    const extension = this.getFileExtension(command.contentType);
    const storageKey = `characters/${command.characterId}/reference-photo.${extension}`;
    const bucket = process.env.STORAGE_BUCKET || 'book-images';

    await this.characterPhotoRepository.updatePhoto(command.characterId, {
      storageBucket: bucket,
      storageKey: storageKey,
    });

    const uploadUrl = await this.storage.getPresignedUploadUrl(
      storageKey,
      command.contentType,
      UPLOAD_URL_EXPIRY_SECONDS
    );

    const photoUrl = this.storage.getImageUrl(bucket, storageKey);

    return {
      uploadUrl,
      photoUrl,
      storageKey,
      expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    };
  }

  private getFileExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    
    const extension = map[contentType];
    if (!extension) {
      throw new InvalidContentTypeError(contentType);
    }
    
    return extension;
  }
}
