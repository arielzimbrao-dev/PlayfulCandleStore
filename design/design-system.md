# Playful Candles — Design System

Referência dos tokens, utilitários e classes do site. A fonte da verdade é o código:
quando este documento e o `.scss` divergirem, vale o `.scss` (e este documento deve ser corrigido).

Estilo: groovy anos 70, divertido e "bubbly", mas fácil de comprar e de ler. Rosa e laranja da
logo em destaque, fundos claros rosados, títulos manuscritos em Genty.

---

## 1. Onde fica cada coisa

```
styles/
  global.scss     → ponto de entrada (importado só no app/layout.tsx)
  _tokens.scss    → variáveis CSS: cores, fontes, espaços, cantos, sombras, animação, z-index
  _mixins.scss    → breakpoints e mixins Sass (não geram CSS sozinhos)
  _base.scss      → reset e elementos HTML sem classe (body, h1–h3, a, button…)
  _shared.scss    → utilitários usados em vários lugares (.wrap, .btn, .script-title…)
  _prose.scss     → texto corrido (.prose) e acordeões (.accordion)

components/Footer/
  Footer.tsx      → o componente importa o seu próprio estilo: import './Footer.scss';
  Footer.scss
```

- **Uma pasta por componente**, com o `.tsx` e o `.scss` dele. Um subcomponente usado por um só
  pai fica numa subpasta (ex.: `Header/SearchBox/`, `ProductCard/QuickAddButton/`).
- **Páginas** com estilo próprio têm o `.scss` ao lado do `page.tsx`
  (`app/carrinho/cart-page.scss`, `app/colecoes/collections-page.scss`,
  `app/produtos/[handle]/product-page.scss`).
- **Camadas (`@layer`)**: `_base` e `_shared`/`_prose` ficam em camadas CSS. O CSS dos componentes
  fica fora de camadas, por isso **sempre vence** um utilitário global, independentemente da ordem
  em que o Next carrega os arquivos. Para ajustar um `.btn` dentro de um componente, basta uma classe.
- **Nomes de classe em BEM, por extenso**: `.bloco`, `.bloco__elemento`, `.bloco--variante`;
  estado com `.is-open`, `.is-active`, `.is-visible`. Nada de abreviações (`.product-card`, não `.bcard`).
- **Medidas em px, múltiplos de 8** (exceções mínimas, ex.: 4px).
- Comentários do código em pt-BR; a copy da loja em pt-PT.

---

## 2. Cores (`styles/_tokens.scss`)

### Marca (Figma)
| Token | Hex | Uso |
|---|---|---|
| `--color-pink` | `#ff5ca6` | Cor principal: títulos em Genty, links, ícones, preço no card. |
| `--color-orange` | `#faa455` | Destaque: botões "Adicionar ao carrinho" e "Explorar coleção". |
| `--color-yellow` | `#ecc94b` | Detalhes: estrelas das avaliações, botão "Comprar agora". |
| `--color-logo-orange` | `#f7902f` | 2.ª palavra dos títulos em duas cores (como na logo), números do Pack. |

### Apoio
| Token | Hex | Uso |
|---|---|---|
| `--color-coral` | `#ff4d7d` | Setas do carrossel, contador do header. |
| `--color-coral-dark` | `#cc1a52` | Hover dos rosas; rosa como texto pequeno (links, eyebrow); `.btn--primary`. |
| `--color-coral-darker` | `#a81244` | Hover do `.btn--primary` e do botão de checkout. |
| `--color-tangerine` | `#ff7a1f` | Hover dos botões laranja. |
| `--color-tangerine-dark` | `#d95c00` | Palavra destacada no título do banner de foto. |
| `--color-gold` | `#ffc42e` | `.btn--gold` (hero), hover das redes sociais no footer. |
| `--color-success` | `#1f8f6b` | Cupom aplicado, "Compra verificada". |

### Texto, fundos e bordas
| Token | Hex | Uso |
|---|---|---|
| `--color-ink` | `#2a1524` | Texto principal (ameixa-escuro, não preto puro). |
| `--color-ink-soft` | `#6d5563` | Texto secundário: legendas, contagens, preço riscado. |
| `--color-page` | `#fafafa` | Fundo do `<body>`. |
| `--color-paper` | `#fdeef5` | Fundo rosado do header. |
| `--color-surface` | `#fffbfd` | Cartões, gavetas, popovers, inputs. |
| `--color-blush` | `#fbdcec` | Placeholders de imagem, realces, resumo do carrinho. |
| `--color-border` | `#f4d3e2` | Linhas e bordas decorativas. |
| `--color-border-strong` | `#e9c2d4` | Bordas de elementos interativos (inputs, pílulas). |

**Regra:** para texto pequeno em rosa sobre fundo claro, preferir `--color-coral-dark`
(mais contraste) em vez de `--color-pink`.

---

## 3. Tipografia

| Token | Fonte | Uso |
|---|---|---|
| `--font-sans` | Poppins (400–800, via `next/font` em `app/fonts.ts`) | Todo o texto, botões, UI. Definida no `<body>` — os elementos herdam. |
| `--font-script` | Genty (local, `app/fonts/Genty.otf`) | Títulos "fun": `.script-title`, `.photo-banner__title`, preços grandes, h1 das páginas de conteúdo. |

| Token | Desktop | Celular | Uso |
|---|---|---|---|
| `--font-size-page-title` | 48px | 32px | h1 das páginas internas (`.container h1`). |
| `--font-size-lead` | 24px | 16px | Parágrafo de abertura (`.prose .lead`, carrinho vazio). |

- Todo `h2` tem no máximo 32px (24px no celular).
- h1–h3: peso 800, `letter-spacing: -0.02em`, `text-wrap: balance`.
- **A Genty (Demo) não tem acentos** (ç, ã, é…): evitar acentos em títulos com `.script-title`.
- **Licença:** o arquivo é *GentyDemo (uso pessoal)* — garantir a licença comercial antes do lançamento.

---

## 4. Layout, cantos, sombras, animação e camadas

| Token | Valor | Uso |
|---|---|---|
| `--site-max-width` | 1920px | Largura máxima do conteúdo (`.wrap`, `.container`). |
| `--gutter` | 40px (16px no celular) | Margem lateral mínima. |
| `--section-spacing` | 48px (24px no celular) | Espaço vertical das `.section`. |
| `--header-height` | 80px | Referência para elementos `sticky` abaixo do header. |
| `--radius-sm / -md / -lg / -xl / -pill` | 8 / 16 / 24 / 32 / 999px | Cantos. Botões e inputs = pílula; cards = 32px com foto 24px. |
| `--shadow-sm / -md / -lg` | — | Repouso / hover / elementos elevados. |
| `--shadow-popover` | — | Menus suspensos e hover dos blocos de aroma. |
| `--focus-ring` | anel branco + rosa | Foco por teclado (aplicado em `:focus-visible` no `_base`). |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | Curva padrão (sem "bounce"). |
| `--duration-fast / --duration / --duration-slow` | 150 / 280 / 600ms | Transições. |
| `--z-sticky / -header / -menu / -drawer / -consent / -toast` | 100 / 200 / 300 / 400 / 450 / 460 | Ordem das camadas fixas. |

**Movimento reduzido:** o `_base` corta todas as animações/transições com
`prefers-reduced-motion: reduce`; os componentes com animação contínua também a desligam.

---

## 5. Breakpoints (`styles/_mixins.scss`)

```scss
@use '../../styles/mixins' as *;   // caminho relativo a partir do .scss do componente

@include small-phone { … }   // até 600px
@include mobile { … }        // até 760px  (o mais usado)
@include tablet { … }        // até 900px
@include below(1200px) { … } // valor pontual
@include above($tablet) { … } // a partir de 900px
@include has-hover { … }     // só dispositivos com mouse
@include reduced-motion { … }
@include hide-scrollbar;     // carrosséis com scroll-snap
@include visually-hidden;
```

Header: `$header-compact` (1535px — a pesquisa vira só a lupa) e `$header-mobile`
(1279px — o menu vira gaveta lateral).

---

## 6. Utilitários globais (`_shared.scss`, `_prose.scss`)

| Classe | Uso |
|---|---|
| `.wrap` | Largura do conteúdo (90%, até `--site-max-width`). |
| `.container` | `.wrap` + espaço vertical de página interna; o `h1` dentro dele usa `--font-size-page-title`. |
| `.section`, `.section__head`, `.section__link` | Seção com espaçamento padrão; cabeçalho com título à esquerda e "Ver tudo →" à direita. |
| `.script-title` | Título em Genty rosa; o `<em>` fica laranja (use o componente `TwoToneTitle`). |
| `.script-title--compact` | h1 de página no tamanho de título de seção (32px), ex.: `/favoritos`. |
| `.script-spark` | Estrelinhas decorativas depois do título. |
| `.eyebrow`, `.eyebrow--large` | Texto pequeno acima de um título. |
| `.btn` + cor | `--primary` (rosa escuro), `--outline`, `--orange` (adicionar ao carrinho), `--yellow` (comprar agora), `--gold` (hero). |
| `.btn` + tamanho | `--compact` (menos padding lateral), `--large` (56px), `--block` (largura toda). |
| `.price-old` | Preço riscado de promoção. |
| `.empty-state` | Mensagem centralizada de "nada para mostrar". |
| `.status-page`, `.status-page__text` | Páginas de erro, 404 e "categoria em breve". |
| `.visually-hidden` | Esconde visualmente, mantém para leitores de tela (o link "Saltar para o conteúdo" aparece no foco). |
| `.groovy-ribbon` | Faixa de 4px com gradiente animado no topo do site. |
| `.prose` | Páginas de conteúdo/jurídicas: h1 em Genty com gradiente, h2 rosa com ✦, listas com bolinha laranja. |
| `.accordion` | Acordeão com `<details>`/`<summary>` (FAQ e informações do produto). |

---

## 7. Componentes e as suas classes

### Estrutura do site
| Componente | Classes |
|---|---|
| `AnnounceBar` | `.announce` · `__arrow`, `__viewport`, `__track` |
| `Header` | `.header` (`.is-open` = gaveta aberta) · `__inner`, `__logo`, `__nav`, `__menu`, `__link` (`.is-active`), `__tools`, `__icon-button`, `__badge`, `__burger`, `__drawer-head`, `__drawer-extra`, `__overlay`, `__desktop-only` |
| `Header/SearchBox` | `.search` (`.is-open`) · `__form`, `__input`, `__results`, `__item`, `__thumb`, `__name`, `__price`, `__message` |
| `Header/AccountMenu` | `.account-menu` · `__popover`, `__title`, `__row`, `__button` (`--shop`, `--main`, `--ghost`) |
| `Footer` | `.footer` · `__inner`, `__grid`, `__logo`, `__social`, `__cookies`, `__bottom`, `__copyright`, `__payment`, `__payment-label`, `__payment-methods`, `__legal-id` |
| `Footer/VipBanner` | `.vip` · `__inner`, `__content`, `__eyebrow`, `__cta` |
| `CookieConsent` | `.consent` · `__body`, `__text`, `__categories`, `__category`, `__actions` |
| `Toast` | `.toasts` (pilha) · `.toast` (`--success`, `--error`) |
| `BackToTop` | `.back-to-top` (`.is-visible`) |
| `Breadcrumbs` | `.breadcrumbs` (item atual com `[aria-current]`) |
| `ScrollReveal` | sem classes próprias: anima `main > section` e `[data-reveal]` quando o `<html>` tem `.reveal-ready` |

### Home
| Componente | Classes |
|---|---|
| `Hero` | `.hero` (ajustes do `PhotoBanner` no celular) |
| `PhotoBanner` | `.photo-banner` (`--text-right`) · `__link`, `__picture`, `__image`, `__content`, `__title`, `__lead` |
| `Appeals` | `.appeals` · `__inner`, `__star`, `__track`, `__item`, `__icon` |
| `CategoryNav` | `.category-nav` · `__inner`, `__title`, `__list`, `__item`, `__photo`, `__name` |
| `PackBanner` | `.pack` · `__frame`, `__card`, `__body`, `__eyebrow`, `__title`, `__lead`, `__list`, `__number`, `__cta`, `__media`, `__tag`, `__tag-label`, `__decoration` (`--1` a `--6`) |
| `ScentGrid` | `.scent-grid` · `__head`, `__list` · bloco de cada aroma: `.scent-tile` |

### Produtos e listagens
| Componente | Classes |
|---|---|
| `ProductCard` | `.product-card` (`--sold-out`) · `__media`, `__image`, `__hover-image`, `__placeholder`, `__badge`, `__body`, `__type`, `__name`, `__price` |
| `ProductCard/QuickAddButton` | `.quick-add` (`--sold-out`) |
| `WishlistButton` | `.wish-button` (`--card`, `--gallery`, `.is-active`) |
| `ProductGrid` | `.product-grid` (também usada pelo `SkeletonGrid`) |
| `ProductGridPaged` | `.load-more` · `__button` |
| `SkeletonGrid` | `.skeleton-card` |
| `PagedCarousel` | `.carousel` · `__stage`, `__viewport`, `__track`, `__arrow` (`--prev`, `--next`), `__dots`, `__dot` |
| `ProductRail` | `.rail` (larguras dos cards dentro do `.carousel`) |
| `ShopLayout` | `.shop-layout` · `__sidebar`, `__filters-title`, `__toolbar`, `__count` |
| `ShopLayout/SortSelect` | `.sort-select` · `__button`, `__menu`, `__option`, `__check` |
| `ProductFilters` | `.filters` · `__clear` · grupo: `.filter-group` · `__title`, `__chevron`, `__options`, `__option` (`.is-active`), `__checkbox` · botão no celular: `.filters-toggle` · `__checkbox`, `__button` |
| `ProductListing` | `.listing-banner` (`--photo`) · `__art` |
| `SearchResultsHeader` | `.search-results__count` |

### Página de produto
| Componente | Classes |
|---|---|
| página (`product-page.scss`) | `.product` · `__grid`, `__info`, `__title-row`, `__weight`, `__meta`, `__collection`, `__rating`, `__description`, `__accordion` |
| `ProductGallery` | `.gallery` · `__track`, `__item`, `__placeholder` |
| `BuyBox` | `.buybox` · `__price`, `__amount`, `__quantity`, `__stock`, `__variant` · `.quantity-stepper` · barra fixa no celular: `.mobile-buy-bar` · `__price`, `__button` |
| `BundleOffer` | `.bundle` · `__row`, `__items`, `__operator`, `__total`, `__price`, `__promo` |
| `ProductReviews` | `.stars` (`--large`) · `.reviews-summary` · `__score`, `__average`, `__count`, `__empty`, `__cta` · `.reviews-distribution` · `__bar`, `__count` · `.review-form` · `__field`, `__counter`, `__honeypot`, `__note`, `__actions` · `.star-picker` (`.is-invalid`) · `__row`, `__star` (`.is-on`), `__label` · `.reviews-list` · `.review` · `__top`, `__verified`, `__text`, `__author` |

### Carrinho
| Componente | Classes |
|---|---|
| `CartDrawer` | `.drawer` (`.is-open`) · `__overlay`, `__header`, `__close`, `__lines`, `__line`, `__thumb`, `__line-info`, `__line-name`, `__line-price`, `__footer`, `__total` |
| `cart/DiscountForm` | `.discount` · `__input`, `__applied` |
| `cart/LineQuantity` | `.line-quantity` · `__step`, `__remove` |
| `cart/CheckoutButton` | `.checkout-button` |
| `cart/TrustList` | `.trust-list` (`--inline`) |
| página (`cart-page.scss`) | `.cart-page` (`--loading`) · `__grid`, `__lines`, `__summary`, `__total`, `__continue` · `.cart-line` · `__thumb`, `__info`, `__name`, `__price` · `.gift-note` · `__input` · `.cart-empty` · `__icon`, `__message` |

### Coleções
| Componente | Classes |
|---|---|
| página (`collections-page.scss`) | `.collections` · `__head`, `__eyebrow`, `__lead`, `__empty`, `__grid` · `.collection-card` · `__image`, `__placeholder`, `__body`, `__name`, `__description`, `__cta` |

---

## 8. Como criar um componente novo

1. Criar `components/NomeDoComponente/NomeDoComponente.tsx` e `NomeDoComponente.scss`.
2. No `.tsx`: `import './NomeDoComponente.scss';` (depois dos outros imports).
3. No `.scss`: `@use '../../styles/mixins' as *;` (ajustar a quantidade de `../`) e um bloco BEM
   com o nome do componente em kebab-case (`.nome-do-componente`).
4. Usar só os tokens (`var(--color-…)`, `var(--radius-…)`…), nunca cores soltas — a não ser que
   seja uma cor única daquele componente (ex.: o roxo oficial do botão "Shop").
5. Reaproveitar `.btn`, `.script-title`, `.section` etc. antes de criar estilos novos.

---

## 9. Ícones e logo

- **Ícones:** Font Awesome 6 Free (CSS importado no `app/layout.tsx`), ex.:
  `<i className="fa-solid fa-cart-shopping" aria-hidden="true" />`. Sempre `aria-hidden` e um
  `aria-label` no botão quando o ícone é o único conteúdo.
- **Logo:** `public/images/logo.png` (1615×341) via `next/image`, no header (com `priority`) e no footer.
