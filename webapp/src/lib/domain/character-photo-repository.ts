export interface CharacterPhoto {
  storageKey: string;
  storageBucket: string;
}

export interface CharacterPhotoRepository {
  hasPhoto(characterId: string): Promise<boolean>;
  updatePhoto(characterId: string, photo: CharacterPhoto): Promise<void>;
}
