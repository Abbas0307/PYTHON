import React, { useState, useMemo } from 'react';
import {
  Phone,
  Shield,
  ExternalLink,
  Compass,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe2,
  X,
  RotateCcw
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LocalResourceCompanion } from '../components/companion/LocalResourceCompanion';
import {
  queryResourceCatalogue,
  CATEGORY_DEFINITIONS,
  SUPPORTED_COUNTRIES,
  ResourceCategory,
  SupportedCountry,
  SupportResource
} from '../data/resourceCatalogue';

interface SupportResourcesScreenProps {
  selectedCountry: string;
  onCountryChange?: (country: string) => void;
}

export const SupportResourcesScreen: React.FC<SupportResourcesScreenProps> = ({
  selectedCountry: initialCountry,
  onCountryChange
}) => {
  const [activeCountry, setActiveCountry] = useState<SupportedCountry | 'All'>(
    (SUPPORTED_COUNTRIES.includes(initialCountry as SupportedCountry)
      ? initialCountry
      : 'India') as SupportedCountry
  );
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCountrySelect = (c: SupportedCountry | 'All') => {
    setActiveCountry(c);
    if (c !== 'All' && onCountryChange) {
      onCountryChange(c);
    }
  };

  const handleResetFilters = () => {
    setActiveCountry('All');
    setActiveCategory('all');
    setSearchQuery('');
  };

  // Query resources based on active filters
  const filteredResources = useMemo(() => {
    return queryResourceCatalogue({
      country: activeCountry,
      category: activeCategory,
      searchQuery,
      verifiedOnly: true
    });
  }, [activeCountry, activeCategory, searchQuery]);

  // Count Category A (emergency dispatch) in the current view
  const hasEmergencyResources = useMemo(() => {
    return filteredResources.some((r) => r.category === 'emergency_dispatch');
  }, [filteredResources]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Navigator Banner */}
      <div className="bg-gradient-to-r from-mindora-lavender/40 via-white to-mindora-surface p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft">
        <div className="max-w-3xl space-y-2">
          <Badge variant="violet" icon={<Compass className="w-3.5 h-3.5" />}>
            Verified Resource Navigator
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Curated Student Wellbeing & Support Directory
          </h1>
          <p className="text-xs sm:text-sm text-mindora-mutedText leading-relaxed">
            Evidence-backed crisis helplines, verified emergency services, and academic resilience resources.
            All contact numbers are verified directly against government health authorities and public charities.
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="mt-5 relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, crisis service, telephone number, or source..."
            aria-label="Search verified support resources"
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-mindora-border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mindora-primary/20 focus:border-mindora-primary transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Country Filter Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
          <span className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-mindora-primary" />
            Select Region or National Focus:
          </span>
          <span className="text-mindora-mutedText font-medium text-[11px]">
            {filteredResources.length} verified {filteredResources.length === 1 ? 'resource' : 'resources'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleCountrySelect('All')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeCountry === 'All'
                ? 'bg-mindora-primary text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Countries
          </button>
          {SUPPORTED_COUNTRIES.map((country) => (
            <button
              key={country}
              onClick={() => handleCountrySelect(country)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                activeCountry === country
                  ? 'bg-mindora-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {country}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs (A to F) */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 px-1">
          Filter by Support Category:
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-mindora-border/60 pb-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_DEFINITIONS) as ResourceCategory[]).map((catKey) => {
            const def = CATEGORY_DEFINITIONS[catKey];
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {def.code}. {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category A Emergency Warning Safeguard */}
      {hasEmergencyResources && (activeCategory === 'emergency_dispatch' || activeCategory === 'all') && (
        <div
          role="alert"
          className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs"
        >
          <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span>Emergency Distinction Notice</span>
              <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                Category A vs Category B
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
              <strong>Category A (Emergency Dispatch)</strong> connects directly to emergency first responders (police, fire, ambulance) for immediate threats to life, severe physical harm, or acute medical emergencies.
              <strong> Category B (Crisis Helplines)</strong> provides free, confidential listening and emotional counseling, but responders cannot dispatch physical emergency units.
            </p>
          </div>
        </div>
      )}

      {/* Optional Local AI Resource Companion (Disabled by Default) */}
      <LocalResourceCompanion selectedCountry={activeCountry === 'All' ? 'India' : activeCountry} />

      {/* Resources Card Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredResources.map((res: SupportResource) => {
            const catDef = CATEGORY_DEFINITIONS[res.category];
            const isCatA = res.category === 'emergency_dispatch';

            return (
              <Card
                key={res.id}
                hoverable
                className={`flex flex-col justify-between space-y-4 transition-all ${
                  isCatA
                    ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/20 via-white to-white'
                    : 'border-mindora-border'
                }`}
              >
                <div className="space-y-3">
                  {/* Category, Status & Verification Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <Badge variant={catDef.badgeVariant}>
                      Category {catDef.code}: {catDef.label}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified {res.lastVerificationDate}
                    </span>
                  </div>

                  {/* Title and Country */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe2 className="w-3 h-3" />
                      <span>{res.countryOrRegion}</span>
                      {res.isEmergencyDispatch && (
                        <span className="text-amber-700 font-extrabold">• Immediate Dispatch</span>
                      )}
                    </div>
                    <h2 className="text-base font-extrabold text-mindora-darkText leading-snug mt-0.5">
                      {res.name}
                    </h2>
                  </div>

                  {/* Telephone Display (if available) */}
                  {res.telephoneNumber && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-mindora-primary" />
                        Telephone / Contact:
                      </span>
                      <span className="text-sm font-extrabold text-mindora-darkText">
                        {res.telephoneNumber}
                      </span>
                    </div>
                  )}

                  {/* Operational Details */}
                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Hours: {res.operatingHours}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">Eligibility: {res.eligibilityRestrictions}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {res.description}
                  </p>

                  {/* Sourcing Provenance */}
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Official Verification Source: </span>
                    <span>{res.officialVerificationSource}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-mindora-mutedText font-medium">
                    Free • Confidential
                  </span>

                  <div className="flex items-center gap-2">
                    {res.dialableNumber && (
                      <a
                        href={`tel:${res.dialableNumber}`}
                        aria-label={`Dial ${res.name} at ${res.dialableNumber}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs ${
                          isCatA
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Dial {res.dialableNumber}</span>
                      </a>
                    )}

                    {res.website && (
                      <a
                        href={res.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit official website for ${res.name}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-mindora-primary hover:text-mindora-secondary bg-mindora-lavender/60 hover:bg-mindora-lavender px-3 py-1.5 rounded-xl transition-all"
                      >
                        <span>Official Website</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="text-center py-12 px-6 border-dashed border-2 border-slate-200">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No matching verified resources found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            No verified resource matched your active filter combination. You can clear your search query or reset your category and country filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-mindora-primary bg-mindora-lavender hover:bg-mindora-lavender/80 px-4 py-2 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </Card>
      )}

      {/* Verification & Offline Governance Card */}
      <Card className="bg-mindora-surface/70 border-mindora-border text-xs text-mindora-mutedText space-y-2.5">
        <h4 className="font-bold text-mindora-darkText flex items-center gap-1.5 text-sm">
          <Shield className="w-4 h-4 text-mindora-primary" />
          <span>Resource Verification Protocol & Offline Safety Guarantee</span>
        </h4>
        <p className="leading-relaxed">
          Every entry in this catalogue is verified directly against authoritative government bodies and certified non-profit health organizations (India MoHFW Tele-MANAS, US SAMHSA 988, UK NHS, Public Health Agency of Canada, and Australian Department of Health).
        </p>
        <p className="leading-relaxed">
          <strong>Offline Guaranteed: </strong> This catalogue is statically compiled into the client-side bundle. All telephone numbers, operating guidelines, and emergency protocols remain 100% accessible even during severe connectivity disruptions or flight mode.
        </p>
        <p className="leading-relaxed text-[11px] text-slate-500">
          <strong>Privacy Assured: </strong> Mindora records zero telemetry, zero call logs, and zero tracking cookies. Dials and web clicks interact solely with your local device dialer or external web browser.
        </p>
      </Card>
    </div>
  );
};
