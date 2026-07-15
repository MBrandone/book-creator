export function buildDescriptionTemplate(characterNames: string[]): string {
	const firstCharacterName = characterNames[0] || "le premier personnage";
	const secondCharacterName = characterNames[1];

	return `Le cadre :
L'histoire se passe à/dans _ (une forêt enchantée, une ville, sous l'océan, à la maison...).
L'ambiance générale est _ (joyeuse, mystérieuse, apaisante, aventureuse...).
Les couleurs dominantes sont _ (2 ou 3 couleurs qui reviennent partout).
La toute première chose que l'on voit en ouvrant le livre, c'est _

Les personnages :
${
	secondCharacterName
		? `${firstCharacterName} est _ (son caractère, sa personnalité). Ce personnage a toujours _ (un objet important).
${secondCharacterName} est _ (son caractère). Ce personnage possède _ (son objet).`
		: `${firstCharacterName} est _ (son caractère, sa personnalité). Ce personnage a toujours _ (un objet important).`
}

Les détails à ne surtout pas oublier : _ (vêtements, accessoires, éléments du décor).

L'histoire : 

Au début, _ (où sont les personnages, que font-ils, quelle est leur vie habituelle ?).
 
Puis soudain, _ (que se passe-t-il ? quel problème ou quelle surprise surgit ?).

Pour s'en sortir, _ (que tentent les personnages ? quels obstacles rencontrent-ils ?).

Finalement, _ (comment l'histoire se termine-t-elle ? quelle leçon ou émotion reste ?).`;
}
