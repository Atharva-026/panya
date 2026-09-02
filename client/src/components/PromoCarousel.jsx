import { useState, useEffect } from "react";

function PromoCarousel({ slides, onSelect }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="promo-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.category}
          className={`promo-slide ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
          onClick={() => onSelect(slide.category)}
        >
          <div className="promo-slide-overlay">
            <div className="promo-slide-eyebrow">Shop the collection</div>
            <div className="promo-slide-title">{slide.label}</div>
            <div className="promo-slide-cta">Shop {slide.label} →</div>
          </div>
        </div>
      ))}

      <div className="promo-dots">
        {slides.map((slide, i) => (
          <button
            key={slide.category}
            className={`promo-dot ${i === index ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            aria-label={`Go to ${slide.label} slide`}
          />
        ))}
      </div>
    </div>
  );
}

export default PromoCarousel;