// Testemunhos de clientes (secção Testimonials da home). Enquanto a lista estiver vazia,
// a secção não aparece.
//
// SÓ entram testemunhos REAIS, copiados tal como foram escritos (Google, Instagram, WhatsApp…),
// e só com autorização de quem os escreveu para os publicar aqui (nome ou iniciais, como a
// pessoa preferir). Nada de textos inventados, editados ou "de exemplo": avaliações falsas são
// proibidas (Diretiva Omnibus / DL 109-G/2021) e também pelas regras do Google.

export type Testimonial = {
  name: string; // nome ou iniciais, como a pessoa autorizou
  text: string; // texto original
  product: string; // ex.: 'Purple Vanilla'
  productHref?: string; // ex.: '/produtos/purple-vanilla'
  source: 'Google' | 'Instagram' | 'WhatsApp' | 'Loja';
  date?: string; // ISO, ex.: '2026-10-01'
  photo?: string; // ex.: '/fotos-playfulcandles/clientes/ana.jpg' (também com autorização)
};

export const TESTIMONIALS: Testimonial[] = [];
