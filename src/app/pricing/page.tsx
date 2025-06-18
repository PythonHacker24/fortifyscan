import Link from 'next/link';
import Footer from '@/components/Footer';

const pricingTiers = [
  {
    name: 'Hobbyist',
    monthlyPrice: 5,
    annualPrice: 90,
    description: 'Perfect for individual developers and small projects',
    features: [
      'Up to 100 code reviews per month',
      'Basic code analysis',
      'Email support',
      '1 team member',
      'Basic security checks',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    monthlyPrice: 29,
    annualPrice: 290,
    description: 'Ideal for growing teams and serious projects',
    features: [
      'Up to 500 code reviews per month',
      'Advanced code analysis',
      'Priority email support',
      'Up to 5 team members',
      'Advanced security checks',
      'Custom rules configuration',
      'API access',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'For large organizations with advanced needs',
    features: [
      'Unlimited code reviews',
      'Full code analysis suite',
      '24/7 priority support',
      'Unlimited team members',
      'Advanced security suite',
      'Custom rules & workflows',
      'Dedicated account manager',
      'SLA guarantees',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-base font-semibold leading-7 text-blue-400">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-blue-400 sm:text-5xl">
            {/* Choose the right plan for&nbsp;you */}
            Under Construction - Planning Best Prices for You
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-400">
          Simple, transparent pricing that grows with you. Try any plan free for 30 days.
        </p>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-lg bg-gray-900 p-8 border border-gray-800 xl:p-10 ${
                tier.highlighted ? 'relative z-10 border-blue-500 shadow-lg shadow-blue-500/20' : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-blue-600 px-3 py-1 text-center text-sm font-semibold text-white">
                  Most popular
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-blue-400">{tier.name}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-400">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-blue-400">${tier.monthlyPrice}</span>
                  <span className="text-sm font-semibold leading-6 text-gray-400">/month</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">or ${tier.annualPrice}/year</p>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-400">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <svg className="h-6 w-5 flex-none text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={tier.name === 'Enterprise' ? '/contact' : '/signup'}
                className={`mt-8 block rounded-lg px-3 py-2 text-center text-sm font-semibold leading-6 transition-all transform hover:scale-105 ${
                  tier.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-blue-400 mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Can I change plans later?</h3>
              <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">What happens after the trial?</h3>
              <p className="text-gray-400">After your 30-day trial, you'll be automatically moved to the plan you selected. You can cancel anytime during the trial.</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-400">Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 