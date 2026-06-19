import { StoryRepository } from '@/lib/domain/story-repository';
import { CharacterRepository } from '@/lib/domain/character-repository';
import { Character } from '@/lib/domain/character';
import { MaxCharactersReachedError } from './max-characters-reached-error';

export type CreateCharacterCommand = {
  id: string;
  name: string;
  description: string;
  photo?: {
    storageKey: string;
    storageBucket: string;
  };
};

export type CreateACharacterForStoryCommand = {
  storyId: string;
  characters: CreateCharacterCommand[];
};

export class CreateACharacterForStoryCommandHandler {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly characterRepository: CharacterRepository
  ) {}

  async execute(command: CreateACharacterForStoryCommand): Promise<void> {
    const story = await this.storyRepository.get(command.storyId);

    if (!story.canAddMoreCharacters()) {
      throw new MaxCharactersReachedError();
    }

    for (const characterData of command.characters) {
      const character = Character.create({
        id: characterData.id,
        storyId: command.storyId,
        name: characterData.name,
        description: characterData.description,
        photoStorageBucket: characterData.photo?.storageBucket,
        photoStorageKey: characterData.photo?.storageKey,
      });

      await this.characterRepository.save(character);
    }
  }
}
