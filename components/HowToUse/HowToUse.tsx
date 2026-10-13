import Image from 'next/image';
import Link from 'next/link';
import TwoToneTitle from '@/components/TwoToneTitle/TwoToneTitle';
import './HowToUse.scss';

// "Como usar os nossos Wax Melts e Snapbars?" (home, categorias wax-melts/snapbars e PDPs delas): 3 passos para quem ainda não conhece wax melts
// e snapbars — tealight no queimador, cera no prato, aroma. Termina com o aviso de segurança.
// Visual: faixa rosada fechada por ondas suaves em cima e em baixo, cartões brancos com foto 3:4.
// ponytail: copy só em PT, como o PackBanner.
const STEPS = [
  {
    image: '/images/how-to/passo-1.jpg',
    title: 'Acende a tealight',
    text: 'Coloca uma vela tealight na base do queimador e acende-a.',
  },
  {
    image: '/images/how-to/passo-2.jpg',
    title: 'Junta a cera',
    text: 'Põe 1 ou 2 peças de Wax Melt no prato de cima, ou parte um quadradinho da Snapbar.',
  },
  {
    image: '/images/how-to/passo-3.jpg',
    title: 'Deixa o aroma espalhar-se',
    text: 'Em poucos minutos a cera derrete e perfuma todo o sítio. Quando o cheiro enfraquecer, troca por cera nova.',
  },
];

// Ondas suaves (geradas no getwaves.io) que fecham a faixa rosada em cima e em baixo.
// fill = currentColor → cor de fundo da faixa (ver .how-to__wave no SCSS).
const WAVE_TOP =
  'M0,192L80,165.3C160,139,320,85,480,85.3C640,85,800,139,960,160C1120,181,1280,171,1360,165.3L1440,160L1440,320L0,320Z';
const WAVE_BOTTOM =
  'M0,224L80,202.7C160,181,320,139,480,144C640,149,800,203,960,218.7C1120,235,1280,213,1360,202.7L1440,192L1440,320L0,320Z';

function Wave({ path, position }: { path: string; position: 'top' | 'bottom' }) {
  return (
    <svg
      className={`how-to__wave how-to__wave--${position}`}
      viewBox="0 64 1440 256"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d={path} />
    </svg>
  );
}

export default function HowToUse() {
  return (
    <section className="how-to" aria-labelledby="how-to-title">
      <Wave path={WAVE_TOP} position="top" />
      <div className="how-to__band">
        <div className="wrap">
          <div className="how-to__head">
            <p className="eyebrow">Nunca experimentaste?</p>
            <h2 id="how-to-title" className="script-title">
              <TwoToneTitle text="Como usar os nossos Wax Melts e Snapbars?" />{' '}
              <span className="script-spark" aria-hidden="true" />
            </h2>
            <p className="how-to__lead">
              Sem pavio e sem fumo: a cera aquece devagar e liberta o aroma. É mais simples do que
              parece.
            </p>
          </div>

          <ol className="how-to__steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="how-to__step">
                <div className="how-to__media">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 90vw, 30vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="how-to__text">
                  <div className="how-to__number" aria-hidden="true">
                    <span>{index + 1}</span>
                  </div>
                  {/* Genty não tem acentos: os títulos dos passos foram escritos sem eles. */}
                  <h3 className="script-title">
                    <TwoToneTitle text={step.title} />
                  </h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="how-to__foot">
            <p className="how-to__safety">
              <i className="fa-solid fa-circle-info" aria-hidden="true" /> Nunca deixes o queimador
              aceso sem vigilância e mantém-no longe de crianças e animais.
            </p>
            <div className="how-to__links">
              <Link href="/categorias/wax-melts" className="btn btn--primary">
                Ver Wax Melts
              </Link>
              <Link href="/categorias/snapbars" className="btn btn--primary">
              Ver Snapbars
            </Link>
            <Link href="/categorias/queimadores" className="btn btn--outline">
                Ver Queimadores
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Wave path={WAVE_BOTTOM} position="bottom" />
    </section>
  );
}
