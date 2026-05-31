import DiscountService from '../DiscountService';

describe('DiscountService - calculateDiscount & promo validation', () => {
  const svc = new DiscountService({} as any);

  test('Compra menor a umbral sin código: sin descuento', () => {
    const r = svc.calculateDiscount({ subtotal: 100000, promo_code: null });
    expect(r.applies).toBe(false);
    expect(r.discount_amount).toBe(0);
  });

  test('Compra igual al umbral aplica descuento automático', () => {
    const r = svc.calculateDiscount({ subtotal: 200000, promo_code: null });
    expect(r.applies).toBe(true);
    expect(r.type).toBe('auto_threshold');
    expect(r.discount_amount).toBe(Math.floor(200000 * 0.1));
  });

  test('Compra con código válido aplica promo_code', () => {
    const r = svc.calculateDiscount({ subtotal: 100000, promo_code: 'DESCUENTO10' });
    expect(r.applies).toBe(true);
    expect(r.type).toBe('promo_code');
    expect(r.promo_code_valid).toBe(true);
    expect(r.discount_amount).toBe(Math.floor(100000 * 0.1));
  });

  test('Código inválido devuelve error y no aplica descuento', () => {
    const r = svc.calculateDiscount({ subtotal: 300000, promo_code: 'NO_EXISTE' });
    expect(r.promo_code_valid).toBe(false);
    expect(r.applies).toBe(true); // auto discount still applies
    expect(r.type).toBe('auto_threshold');
    expect((r as any).promo_error).toBeDefined();
  });
});
