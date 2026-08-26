export async function streamResponse(
  text: string,
  onUpdate: (value: string) => void,
  speed = 18
) {
  let current = "";

  for (const character of text) {
    current += character;

    onUpdate(current);

    await new Promise((resolve) =>
      setTimeout(resolve, speed)
    );
  }

  return current;
}
