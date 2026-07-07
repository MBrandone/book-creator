import { test, expect } from '@playwright/test';

test.describe('Create a Story', () => {
  test('should create a complete story with 2 characters and generate images', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Transformez/i })).toBeVisible();
    await page.getByRole('link', { name: /Créer ma première histoire/i }).click();

    await expect(page.getByRole('heading', { name: /Créer une histoire/i })).toBeVisible();

    const storyTitle = `Test Story ${Date.now()}`;
    const storyDescription = 'Une histoire de test générée automatiquement pour valider le parcours complet';

    await page.getByLabel(/Nom de l'histoire/i).fill(storyTitle);
    await page.getByLabel(/Description/i).fill(storyDescription);
    await page.getByRole('button', { name: /Créer l'histoire/i }).click();

    await expect(page.getByText(/Histoire créée avec succès/i)).toBeVisible();

    await expect(page.getByText(/Ajouter un Personnage/i)).toBeVisible();

    await page.getByLabel(/Nom du personnage/i).fill('Alice');
    await page.getByLabel(/Description du personnage/i).fill('Une petite fille courageuse qui aime l\'aventure');

    const testImagePath = 'tests/e2e/test-fixtures/character-photo.png';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Ajouter le personnage/i }).click();

    await expect(page.getByText(/Personnage créé avec succès/i)).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText(/Photo de référence ajoutée/i)).toBeVisible();

    await page.getByRole('button', { name: /Ajouter un autre personnage/i }).click();

    await expect(page.getByText(/Ajouter un Personnage/i)).toBeVisible();

    await page.getByLabel(/Nom du personnage/i).fill('Bob');
    await page.getByLabel(/Description du personnage/i).fill('Un garçon intelligent et drôle qui adore résoudre des énigmes');

    await page.getByRole('button', { name: /Ajouter le personnage/i }).click();

    await expect(page.getByText(/Personnage créé avec succès/i)).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();

    await expect(page.getByRole('button', { name: /Générer l'histoire/i })).toBeVisible();
    await page.getByRole('button', { name: /Générer l'histoire/i }).click();

    await expect(page.getByText(/Génération en cours/i)).toBeVisible();

    await page.waitForTimeout(15000);

    await expect(page.getByText(/Histoire générée avec succès/i)).toBeVisible({ timeout: 15000 });

    const sceneImages = page.locator('img[alt^="Scène"]');
    await expect(sceneImages).toHaveCount(4);

    for (let i = 1; i <= 4; i++) {
      const sceneImage = page.locator(`img[alt*="Scène ${i}"]`);
      await expect(sceneImage).toBeVisible();
    }

    await expect(page.getByText(storyTitle)).toBeVisible();
    await expect(page.getByText(storyDescription)).toBeVisible();
  });
});
