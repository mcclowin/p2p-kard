import React from "react";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";

function AyahCard({ arabic, translation, reference }) {
  return (
    <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/80 to-white p-6 space-y-3 shadow-[var(--shadow-sm)]">
      <p className="text-right text-2xl leading-loose font-heading text-emerald-900" dir="rtl" lang="ar">
        {arabic}
      </p>
      <p className="text-[var(--color-text-muted)] italic leading-relaxed">"{translation}"</p>
      <p className="text-sm font-semibold text-emerald-700">{reference}</p>
    </div>
  );
}

function HadithCard({ text, source }) {
  return (
    <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/60 to-white p-6 space-y-3 shadow-[var(--shadow-sm)]">
      <p className="text-[var(--color-text-muted)] italic leading-relaxed">"{text}"</p>
      <p className="text-sm font-semibold text-amber-800">{source}</p>
    </div>
  );
}

export default function TheBeautifulLoan() {
  return (
    <Page>
      <article className="max-w-3xl mx-auto space-y-10 pb-16">
        {/* Header */}
        <FadeIn>
          <header className="text-center space-y-4 pt-4">
            <p className="text-5xl" aria-hidden="true">🤲</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 font-serif">
              The Beautiful Loan
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              <em>Qard Hasan</em> — an ancient practice of lending without interest,
              rooted in compassion and community.
            </p>
          </header>
        </FadeIn>

        {/* What it means */}
        <FadeIn delay={0.05}>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 font-serif">What is Qard Hasan?</h2>
            <p className="text-slate-700 leading-relaxed">
              In Arabic, <em>Qard Hasan</em> (قرض حسن) literally means "a beautiful loan" or
              "a goodly loan." It refers to lending money to someone in need with no expectation
              of interest, profit, or any return beyond the principal. It's not charity — the
              borrower is expected to repay — but it is an act of deep generosity, because the
              lender gains nothing materially. The only "return" is the knowledge that you helped
              someone through a hard moment.
            </p>
            <p className="text-slate-700 leading-relaxed">
              The concept predates modern banking by over a thousand years. In a world where
              payday lenders charge 400% APR, the idea that you could lend someone money and
              simply… ask for it back, with nothing extra, feels almost radical. But for much of
              human history, this is how communities looked after each other.
            </p>
          </section>
        </FadeIn>

        {/* From the Quran */}
        <FadeIn delay={0.1}>
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 font-serif">From the Quran</h2>
            <p className="text-slate-600 leading-relaxed">
              The Quran mentions Qard Hasan multiple times, framing it not just as a financial
              act but as a spiritual one — a loan to God Himself.
            </p>

            <div className="space-y-4">
              <AyahCard
                arabic="مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً ۚ وَاللَّهُ يَقْبِضُ وَيَبْسُطُ وَإِلَيْهِ تُرْجَعُونَ"
                translation="Who is it that will lend Allah a goodly loan, that He may multiply it for him many times over? It is Allah who withholds and who grants abundance, and to Him you will all be returned."
                reference="Quran 2:245 (Al-Baqarah)"
              />

              <AyahCard
                arabic="وَإِن كَانَ ذُو عُسْرَةٍ فَنَظِرَةٌ إِلَىٰ مَيْسَرَةٍ ۚ وَأَن تَصَدَّقُوا خَيْرٌ لَّكُمْ ۖ إِن كُنتُمْ تَعْلَمُونَ"
                translation="And if the debtor is in hardship, then let there be postponement until a time of ease. But if you give it as charity, it is better for you, if only you knew."
                reference="Quran 2:280 (Al-Baqarah)"
              />

              <AyahCard
                arabic="مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ وَلَهُ أَجْرٌ كَرِيمٌ"
                translation="Who is it that will lend Allah a goodly loan, that He may multiply it for him and there will be a noble reward for him?"
                reference="Quran 57:11 (Al-Hadid)"
              />

              <AyahCard
                arabic="وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَأَقْرِضُوا اللَّهَ قَرْضًا حَسَنًا ۚ وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ هُوَ خَيْرًا وَأَعْظَمَ أَجْرًا"
                translation="And establish prayer and give zakah and lend Allah a goodly loan. And whatever good you put forward for yourselves, you will find it with Allah — it is better and greater in reward."
                reference="Quran 73:20 (Al-Muzzammil)"
              />
            </div>
          </section>
        </FadeIn>

        {/* From the Seerah */}
        <FadeIn delay={0.15}>
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 font-serif">From the Prophetic Tradition</h2>
            <p className="text-slate-600 leading-relaxed">
              The Prophet Muhammad ﷺ didn't just teach about lending — he lived it. Here are
              moments from his life that show what Qard Hasan looks like in practice.
            </p>

            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">The Camel That Was Repaid Better</h3>
                <p className="text-slate-700 leading-relaxed">
                  A man once came to the Prophet ﷺ demanding repayment of a debt, speaking roughly
                  to him. The companions wanted to respond, but the Prophet ﷺ stopped them, saying:
                  "Leave him, for the one who has a right is entitled to speak." He then borrowed a
                  camel of a better age than what he owed and gave it to the man.
                </p>
                <HadithCard
                  text="The best of you are those who are best in repaying debts."
                  source="Sahih Muslim 1601 — narrated by Abu Hurayrah (رضي الله عنه)"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">The Ansari Who Gave Everything</h3>
                <p className="text-slate-700 leading-relaxed">
                  When the Muslim refugees (Muhajirun) arrived in Madinah with nothing, the local
                  Ansari community didn't offer loans with conditions — they offered to split their
                  wealth, their homes, even their orchards. This wasn't charity from above; it was
                  community solidarity between equals. The Muhajirun, for their part, took only what
                  they needed and worked to repay through trade and labour.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">Relief for the Distressed</h3>
                <p className="text-slate-700 leading-relaxed">
                  The Prophet ﷺ placed immense emphasis on easing the burden of those in debt,
                  promising spiritual reward for those who show patience and compassion.
                </p>
                <HadithCard
                  text="Whoever relieves a believer of a hardship from the hardships of this world, Allah will relieve him of a hardship from the hardships of the Day of Judgement. Whoever makes things easy for one in difficulty, Allah will make things easy for him in this world and the next."
                  source="Sahih Muslim 2699 — narrated by Abu Hurayrah (رضي الله عنه)"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">The Forgiver in the Marketplace</h3>
                <p className="text-slate-700 leading-relaxed">
                  The Prophet ﷺ told the story of a merchant who used to lend to people. Whenever
                  he found a debtor in hardship, he would tell his servants: "Forgive him, that
                  perhaps Allah may forgive us." And when that merchant met Allah, He forgave him.
                </p>
                <HadithCard
                  text="There was a merchant who used to give loans to people. If he saw that someone was in hardship, he would say to his boys: 'Forgive him, so that Allah may forgive us.' So Allah forgave him."
                  source="Sahih al-Bukhari 2078 — narrated by Abu Hurayrah (رضي الله عنه)"
                />
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Closing */}
        <FadeIn delay={0.2}>
          <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/40 border border-emerald-200/40 p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 font-serif">A Tradition for Everyone</h2>
            <p className="text-slate-700 leading-relaxed max-w-xl mx-auto">
              You don't have to be Muslim to appreciate the beauty of interest-free lending.
              The idea is universal: when your neighbour is struggling, you help — and you don't
              profit from their hardship. That's it. That's the whole thing.
            </p>
            <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
              HandUp is built on this principle. Every loan on this platform is a Qard Hasan —
              zero interest, full dignity, community trust. We're just making an ancient practice
              work in the modern world.
            </p>
          </section>
        </FadeIn>
      </article>
    </Page>
  );
}
