export async function generateScenario(storyId: string): Promise<void> {
  const response = await fetch(`/api/stories/${storyId}/scenario-generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Échec de la génération du scénario');
  }
}
