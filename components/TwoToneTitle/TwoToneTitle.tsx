// Texto de título em duas cores, como a logo: a 1.ª palavra rosa e o resto laranja
// (o resto vai num <em>, colorido pela classe .script-title).
// "Best-Sellers" é dividido no hífen; uma palavra só fica toda rosa.
export default function TwoToneTitle({ text }: { text: string }) {
  const firstSpace = text.indexOf(' ');
  const splitAt = firstSpace > 0 ? firstSpace : text.indexOf('-') + 1;
  if (splitAt <= 0 || splitAt >= text.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, splitAt)}
      <em>{text.slice(splitAt)}</em>
    </>
  );
}
