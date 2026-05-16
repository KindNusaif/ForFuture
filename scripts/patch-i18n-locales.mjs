import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../src/i18n/locales')
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))

function deepMerge(base, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch
  const out = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object'
        ? deepMerge(base[k], v)
        : v
  }
  return out
}

const ta = deepMerge(en, {
  language: { label: 'மொழி', select: 'மொழியைத் தேர்ந்தெடுக்கவும்' },
  nav: {
    home: 'முகப்பு', myFeed: 'என் ஃபீடு', impactMap: 'தாக்கம் வரைபடம்', map: 'வரைபடம்',
    create: 'உருவாக்கு', createMovement: 'இளைஞர் இயக்கம் உருவாக்கு', quickPolls: 'விரைவு வாக்கெடுப்புகள்',
    polls: 'வாக்கெடுப்புகள்', profile: 'சுயவிவரம்', myProfile: 'என் சுயவிவரம்', moderation: 'மிதப்படுத்தல்',
    explore: 'இளைஞர் முன்னேற்றத்தை ஆராய்', about: 'எங்களை பற்றி', login: 'உள்நுழை', signup: 'ForFuture-இல் சேரவும்', logout: 'வெளியேறு',
  },
  landing: {
    eyebrow: 'ForFuture — இளைஞர் குரல்கள். உண்மையான செயல். சிறந்த நாளை.',
    heroTitle: 'பேசவும், ஒழுங்குபடுத்தவும், எதிர்காலத்தை வடிவமைக்கவும் இளைஞர்களை வலுப்படுத்துதல்.',
    heroSubtitle: 'கருத்துகளை பகிரவும், உங்கள் குரலை உயர்த்தவும், தன்னார்வ இயக்கங்களில் சேரவும், நம்பகமான பிரச்சாரங்களுக்கு ஆதரவு அளிக்கவும்.',
    heroTagline: 'இளைஞர் குரல்கள் இயக்கங்களாக மாறும் இடம்.',
    joinCta: 'ForFuture-இல் சேரவும்', exploreCta: 'இளைஞர் முன்னேற்றத்தை ஆராய்',
    featuresTitle: 'அர்த்தமுள்ள இளைஞர் தாக்கத்திற்காக உருவாக்கப்பட்டது',
    whyTitle: 'ஏன் ForFuture?', whySubtitle: 'சுதந்திரமாக பேசுங்கள். துணிவாக ஒழுங்குபடுத்துங்கள்.',
    ctaTitle: 'உங்கள் குரல் நாளைய இயக்கமாக மாறலாம்.',
  },
  auth: {
    loginTitle: 'மீண்டும் வரவேற்கிறோம்', signupTitle: 'ForFuture-இல் சேரவும்',
    email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', displayName: 'காட்டும் பெயர்',
    loginButton: 'உள்நுழை', signupButton: 'கணக்கு உருவாக்கு', pleaseWait: 'தயவு செய்து காத்திருக்கவும்…',
    backHome: '← முகப்புக்கு திரும்பு',
  },
  explore: {
    title: 'இளைஞர் முன்னேற்றத்தை ஆராய்', welcome: 'இளைஞர் முன்னேற்றத்திற்கு வரவேற்கிறோம்',
    subtitle: 'இலங்கை முழுவதும் இளைஞர் வழிநடத்தும் யோசனைகள், தன்னார்வ இயக்கங்கள், வாக்கெடுப்புகள்.',
    guestBanner: 'விருந்தினராக உலாவுகிறீர்கள்.', guestJoin: 'ForFuture-இல் சேரவும்', guestContribute: 'பங்களிக்க.',
  },
  feed: {
    guestTitle: 'இளைஞர் முன்னேற்றம்', memberTitle: 'உங்கள் ஃபீடு',
    searchPlaceholder: 'இயக்கங்கள், ஆசிரியர்கள், தலைப்புகள் தேடவும்…',
    moreFilters: 'மேலும் வடிகட்டிகள்', loadMore: 'மேலும் ஏற்று', createMovement: 'இளைஞர் இயக்கம் உருவாக்கு',
  },
  create: {
    title: 'இளைஞர் இயக்கம் உருவாக்கு', publish: 'இயக்கத்தை வெளியிடு', publishing: 'வெளியிடப்படுகிறது…',
    movementType: 'இயக்க வகை', titleLabel: 'தலைப்பு', descriptionLabel: 'விளக்கம்', categoryLabel: 'வகை',
  },
  categories: {
    all: 'அனைத்தும்', Education: 'கல்வி', Environment: 'சுற்றுச்சூழல்', Health: 'ஆரோக்கியம்',
    Community: 'சமூகம்', Rights: 'உரிமைகள்', Technology: 'தொழில்நுட்பம்', Arts: 'கலை', Other: 'மற்றவை',
  },
  movements: {
    all: 'அனைத்தும்',
    idea_for_change: {
      label: 'மாற்றத்திற்கான யோசனை', shortLabel: 'யோசனைகள்',
      cta: 'இந்த யோசனைக்கு ஆதரவளி', ctaActive: 'ஆதரிக்கப்படுகிறது',
    },
    raise_voice: { label: 'உங்கள் குரலை உயர்த்துங்கள்', shortLabel: 'குரல்கள்', cta: 'இந்த குரலுடன் நிற்கவும்' },
    volunteer_drive: { label: 'தன்னார்வ இயக்கம்', shortLabel: 'தன்னார்வம்', cta: 'நான் தன்னார்வமாக இணைகிறேன்' },
    fundraising: { label: 'நிதி திரட்டல் பிரச்சாரம்', shortLabel: 'நிதி திரட்டல்', cta: 'நான் ஆதரிக்க விரும்புகிறேன்' },
    peaceful_civic_action: { label: 'அமைதியான குடிமை செயல்', shortLabel: 'குடிமை செயல்', cta: 'இக்காரணத்தில் சேருங்கள்' },
    youth_petition: { label: 'இளைஞர் மனு', shortLabel: 'மனுக்கள்', cta: 'மனுவில் கையெழுத்திடு' },
    quick_youth_poll: { label: 'விரைவு இளைஞர் வாக்கெடுப்பு', shortLabel: 'வாக்கெடுப்புகள்', cta: 'வாக்களி' },
    removedParticipation: 'உங்கள் பங்கேற்பை நீக்கிவிட்டீர்கள்.',
  },
  voice: {
    title: 'உங்கள் குரலைத் தேர்வு செய்யவும்', postAsProfile: 'என் சுயவிவரமாக பதிவிடு',
    postAsYouthVoice: 'Youth Voice ID மூலம் பதிவிடு', yourYouthVoiceId: 'உங்கள் Youth Voice ID',
  },
  polls: { vote: 'வாக்களி', viewResults: 'முடிவுகளைப் பார்', totalVotes: 'மொத்த வாக்குகள்' },
  petitions: {
    sign: 'மனுவில் கையெழுத்திடு', youthSupporters: 'இளைஞர் ஆதரவாளர்கள்',
    requestedChange: 'கோரப்பட்ட மாற்றம்', targetAuthority: 'இலக்கு அதிகாரம்', supportGoal: 'ஆதரவு இலக்கு',
  },
  moderation: {
    reportContent: 'உள்ளடக்கத்தை புகாரளி', reportSubmitted: 'புகார் சமர்ப்பிக்கப்பட்டது',
    underReview: 'பரிசீலனையில் உள்ளது', actionTaken: 'நடவடிக்கை எடுக்கப்பட்டது', noViolation: 'விதிமீறல் எதுவும் இல்லை',
  },
  trust: {
    verifiedOrganization: 'சரிபார்க்கப்பட்ட நிறுவனம்', trustedCampaign: 'நம்பகமான பிரச்சாரம்',
    trustedFundraising: 'நம்பகமான நிதி திரட்டல் பிரச்சாரம்', trustedPetition: 'நம்பகமான மனு',
  },
  profile: {
    title: 'என் சுயவிவரம்', myMovements: 'என் இயக்கங்கள்', myYouthVoiceId: 'என் Youth Voice ID',
    postedAsProfile: 'சுயவிவரமாக பதிவிட்டது', postedAsYouthVoice: 'Youth Voice ID ஆக பதிவிட்டது',
  },
  guestModal: {
    title: 'இயக்கத்தில் இணையுங்கள்', joinFree: 'இலவசமாக சேரவும்', logIn: 'உள்நுழை', close: 'மூடு',
  },
  loading: {
    session: 'உங்கள் அமர்வு ஏற்றப்படுகிறது…', slowHint: 'இது வழக்கத்தை விட சிறிது நேரம் எடுக்கிறது…',
    retry: 'மீண்டும் முயற்சி', loadFailed: 'இந்த உள்ளடக்கத்தை இப்போது ஏற்ற முடியவில்லை.',
  },
  common: { close: 'மூடு', cancel: 'ரத்து செய்', save: 'சேமி', back: 'பின்' },
})

const si = deepMerge(en, {
  language: { label: 'භාෂාව', select: 'භාෂාව තෝරන්න' },
  nav: {
    home: 'මුල් පිටුව', myFeed: 'මගේ ෆීඩ්', impactMap: 'බලපෑම් සිතියම', map: 'සිතියම',
    create: 'තනන්න', createMovement: 'යෞවන ව්‍යාපාරයක් තනන්න', quickPolls: 'ක්ෂණික මතවිමසුම්',
    polls: 'මතවිමසුම්', profile: 'පැතිකඩ', myProfile: 'මගේ පැතිකඩ', moderation: 'මධ්‍යස්ථකරණය',
    explore: 'යෞවන ගතිකත්වය සොයන්න', about: 'අප ගැන', login: 'ඇතුල් වන්න', signup: 'ForFuture එකට එක්වන්න', logout: 'ඉවත් වන්න',
  },
  landing: {
    eyebrow: 'ForFuture — යෞවන හඬ. සැබෑ ක්‍රියා. වඩා හොඳ හෙටක්.',
    heroTitle: 'කතා කරන්න, සංවිධානය කරන්න, සහ අනාගතය හැඩගස්වන්න යෞවනයන් සවිබල ගන්වමින්.',
    heroSubtitle: 'අදහස් බෙදාගන්න, ඔබේ හඬ නඟන්න, ස්වේච්ඡා ව්‍යාපාරවලට එක්වන්න.',
    heroTagline: 'යෞවන හඬ ව්‍යාපාර බවට පත්වන තැන.',
    joinCta: 'ForFuture එකට එක්වන්න', exploreCta: 'යෞවන ගතිකත්වය සොයන්න',
    featuresTitle: 'අර්ථවත් යෞවන බලපෑම සඳහා නිර්මාණය කළේය',
    whyTitle: 'ඇයි ForFuture?', whySubtitle: 'නිදහසේ කතා කරන්න. ධෛර්යයෙන් සංවිධානය කරන්න.',
    ctaTitle: 'ඔබේ හඬ හෙට දවසේ ව්‍යාපාරයක් වෙන්න පුළුවන්.',
  },
  auth: {
    loginTitle: 'නැවත සාදරයෙන් පිළිගනිමු', signupTitle: 'ForFuture එකට එක්වන්න',
    email: 'ඊමේල්', password: 'මුරපදය', displayName: 'පෙන්වන නම',
    loginButton: 'ඇතුල් වන්න', signupButton: 'ගිණුම තනන්න', pleaseWait: 'කරුණාකර රැඳී සිටින්න…',
    backHome: '← මුල් පිටුවට ආපසු',
  },
  explore: {
    title: 'යෞවන ගතිකත්වය සොයන්න', welcome: 'යෞවන ගතිකත්වයට සාදරයෙන් පිළිගනිමු',
    subtitle: 'ශ්‍රී ලංකාව පුරා යෞවන නායකත්වය දරන අදහස්, ස්වේච්ඡා මෙහෙයුම්, මතවිමසුම්.',
    guestBanner: 'අමුත්තෙකු ලෙස බැලීමක්.', guestJoin: 'ForFuture එකට එක්වන්න', guestContribute: 'දායක වීමට.',
  },
  feed: {
    guestTitle: 'යෞවන ගතිකත්වය', memberTitle: 'ඔබේ ෆීඩ්',
    searchPlaceholder: 'ව්‍යාපාර, ලේඛකයින්, මාතෘකා සොයන්න…',
    moreFilters: 'වැඩි පෙරහන්', loadMore: 'තව පෙන්වන්න', createMovement: 'යෞවන ව්‍යාපාරයක් තනන්න',
  },
  create: {
    title: 'යෞවන ව්‍යාපාරයක් තනන්න', publish: 'ව්‍යාපාරය ප්‍රසිද්ධ කරන්න', publishing: 'ප්‍රසිද්ධ කරමින්…',
    movementType: 'ව්‍යාපාර වර්ගය', titleLabel: 'ශීර්ෂය', descriptionLabel: 'විස්තරය', categoryLabel: 'ප්‍රවර්ගය',
  },
  categories: {
    all: 'සියල්ල', Education: 'අධ්‍යාපනය', Environment: 'පරිසරය', Health: 'සෞඛ්‍යය',
    Community: 'ප්‍රජාව', Rights: 'අයිතිවාසිකම්', Technology: 'තාක්ෂණය', Arts: 'කලා', Other: 'වෙනත්',
  },
  movements: {
    all: 'සියල්ල',
    idea_for_change: { label: 'වෙනසකට අදහසක්', shortLabel: 'අදහස්', cta: 'මේ අදහසට සහය දෙන්න' },
    raise_voice: { label: 'ඔබේ හඬ නඟන්න', shortLabel: 'හඬ', cta: 'මෙම හඬ සමඟ සිටින්න' },
    volunteer_drive: { label: 'ස්වේච්ඡා මෙහෙයුම', shortLabel: 'ස්වේච්ඡා', cta: 'මම ස්වේච්ඡාවෙන් එක්වෙමි' },
    fundraising: { label: 'අරමුදල් රැස්කිරීමේ ප්‍රචාරණය', shortLabel: 'අරමුදල් රැස්කිරීම', cta: 'මම සහය දීමට කැමතියි' },
    peaceful_civic_action: { label: 'සාමකාමී පුරවැසි ක්‍රියාව', shortLabel: 'පුරවැසි ක්‍රියාව', cta: 'මෙම අරමුණට එක්වන්න' },
    youth_petition: { label: 'යෞවන පෙත්සම', shortLabel: 'පෙත්සම්', cta: 'පෙත්සමට අත්සන් කරන්න' },
    quick_youth_poll: { label: 'ක්ෂණික යෞවන මතවිමසුම', shortLabel: 'මතවිමසුම්', cta: 'ඡන්දය දෙන්න' },
    removedParticipation: 'ඔබගේ සහභාගීත්වය ඉවත් කළා.',
  },
  voice: {
    title: 'ඔබේ හඬ තෝරන්න', postAsProfile: 'මගේ පැතිකඩ ලෙස පළ කරන්න',
    postAsYouthVoice: 'Youth Voice ID සමඟ පළ කරන්න', yourYouthVoiceId: 'ඔබගේ Youth Voice ID',
  },
  polls: { vote: 'ඡන්දය දෙන්න', viewResults: 'ප්‍රතිඵල බලන්න', totalVotes: 'මුළු ඡන්ද' },
  petitions: {
    sign: 'පෙත්සමට අත්සන් කරන්න', youthSupporters: 'යෞවන සහායකයන්',
    requestedChange: 'ඉල්ලූ වෙනස', targetAuthority: 'ඉලක්ක අධිකාරිය', supportGoal: 'සහාය ඉලක්කය',
  },
  moderation: {
    reportContent: 'අන්තර්ගතය වාර්තා කරන්න', reportSubmitted: 'වාර්තාව යවා ඇත',
    underReview: 'සමාලෝචනය යටතේ', actionTaken: 'ක්‍රියාමාර්ග ගෙන ඇත', noViolation: 'උල්ලංඝනයක් හමු නොවීය',
  },
  trust: {
    verifiedOrganization: 'සත්‍යාපිත සංවිධානය', trustedCampaign: 'විශ්වාසදායක ප්‍රචාරණය',
    trustedFundraising: 'විශ්වාසදායක අරමුදල් රැස්කිරීමේ ප්‍රචාරණය', trustedPetition: 'විශ්වාසදායක පෙත්සම',
  },
  profile: {
    title: 'මගේ පැතිකඩ', myMovements: 'මගේ ව්‍යාපාර', myYouthVoiceId: 'මගේ Youth Voice ID',
    postedAsProfile: 'පැතිකඩ ලෙස පළ කළේ', postedAsYouthVoice: 'Youth Voice ID ලෙස පළ කළේ',
  },
  guestModal: {
    title: 'ව්‍යාපාරයට එක්වන්න', joinFree: 'නොමිලේ එක්වන්න', logIn: 'ඇතුල් වන්න', close: 'වසන්න',
  },
  loading: {
    session: 'ඔබගේ සැසිවාරය පූරණය වෙමින්…', slowHint: 'මෙයට සාමාන්‍යයට වඩා ටිකක් වැඩි කාලයක් ගනී…',
    retry: 'නැවත උත්සාහ කරන්න', loadFailed: 'මෙම අන්තර්ගතය දැන් පූරණය කළ නොහැක.',
  },
  common: { close: 'වසන්න', cancel: 'අවලංගු කරන්න', save: 'සුරකින්න', back: 'ආපසු' },
})

fs.writeFileSync(path.join(localesDir, 'ta.json'), JSON.stringify(ta, null, 2) + '\n', 'utf8')
fs.writeFileSync(path.join(localesDir, 'si.json'), JSON.stringify(si, null, 2) + '\n', 'utf8')
console.log('Patched ta.json and si.json')
