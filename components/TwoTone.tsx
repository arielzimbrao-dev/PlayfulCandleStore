// Título em duas cores, como a logo: 1.ª palavra rosa, o resto laranja (<em>, ver .script-title em).
// "Best-Sellers" parte no hífen; uma palavra só fica toda rosa.
export default function TwoTone({ text }: { text: string }) {
  const sp = text.indexOf(' ');
  const i = sp > 0 ? sp : text.indexOf('-') + 1;
  if (i <= 0 || i >= text.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <em>{text.slice(i)}</em>
    </>
  );
}
