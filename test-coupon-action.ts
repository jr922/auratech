import { validateCoupon } from './app/actions/coupons';

async function main() {
  const result = await validateCoupon('AURA20', 100);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
