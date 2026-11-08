import LegalPage, { BulletList, Detail, LegalSection } from './LegalPage'
import { LEGAL } from '../config'
import { openCookieSettings } from '../lib/consent'

// ==========================================
// Privacy policy | מדיניות פרטיות
// ==========================================
export default function PrivacyPolicy() {
  return (
    <LegalPage title="מדיניות פרטיות" updated={LEGAL.lastUpdated}>
      <p>
        מדיניות זו מסבירה אילו פרטים נאספים באתר, למה הם משמשים ומהן הזכויות שלך לפי חוק הגנת הפרטיות, התשמ״א-1981. בעלת האתר והאחראית על
        המידע: <Detail value={LEGAL.ownerName} missing="שם מלא של בעלת האתר או העסק" />.
      </p>

      <LegalSection title="אילו פרטים נאספים">
        <BulletList
          items={[
            'בתיאום שיחת היכרות: שם, טלפון, כתובת מייל והמועד שנבחר.',
            'בהודעה שנשלחת דרך WhatsApp: התוכן שבחרת לכתוב.',
            'נתונים טכניים שנשלחים אוטומטית לשרתים שמהם נטען האתר, כגון כתובת IP וסוג הדפדפן.',
          ]}
        />
        <p>
          אין חובה חוקית למסור את הפרטים, והמסירה תלויה ברצונך. בלי שם ודרך ליצירת קשר לא נוכל לתאם שיחה, אבל אפשר תמיד לפנות ישירות
          בוואטסאפ.
        </p>
      </LegalSection>

      <LegalSection title="למה הפרטים משמשים">
        <BulletList
          items={[
            'תיאום שיחת ההיכרות, אישור המועד ויצירת קשר בנוגע אליו.',
            'ניהול היומן ומניעת כפילויות בתיאום.',
            'תפעול האתר, אבטחתו ושיפורו.',
          ]}
        />
      </LegalSection>

      <LegalSection title="עם מי הפרטים משותפים">
        <p>הפרטים אינם נמכרים. הם מועברים רק לספקי השירות שמפעילים את האתר, ורק ככל שנדרש לכך:</p>
        <BulletList
          items={[
            'Supabase: אחסון היומן והתיאומים.',
            'EmailJS: שליחת מיילים על תיאום השיחה.',
            'WhatsApp (Meta): העברת הודעות שבחרת לשלוח.',
            'Google Fonts ו-Unsplash: טעינת הגופנים והתמונות של האתר, שבמהלכה כתובת ה-IP נחשפת להם.',
          ]}
        />
        <p>חלק מהספקים פועלים מחוץ לישראל, ולכן המידע עשוי להישמר או לעבור מחוץ לגבולותיה.</p>
      </LegalSection>

      <LegalSection title="עוגיות ואחסון בדפדפן">
        <p>אלו הקטגוריות שבהן האתר משתמש, ואלה שאינן הכרחיות פועלות רק באישורך:</p>
        <BulletList
          items={[
            <>
              <strong className="font-medium">הכרחיות (תמיד פעילות):</strong> שמירת בחירת העוגיות (cookie_consent_v1), הגדרות הנגישות
              (a11y_prefs_v1) ומיקום הגלילה בדף (scroll-y).
            </>,
            <>
              <strong className="font-medium">סטטיסטיקה:</strong> מדידת השימוש באתר, למשל באמצעות Google Analytics.
            </>,
            <>
              <strong className="font-medium">שיווק:</strong> מדידת פרסום והתאמתו, למשל באמצעות Meta Pixel.
            </>,
          ]}
        />
        <p>אפשר לשנות את הבחירה בכל עת, וביטול הסכמה מפסיק את פעולת הכלים האלה:</p>
        <button
          type="button"
          onClick={openCookieSettings}
          className="rounded-full border-2 border-forest-moss bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-river-mist"
        >
          הגדרות עוגיות
        </button>
      </LegalSection>

      <LegalSection title="הזכויות שלך">
        <p>
          זכותך לעיין במידע שנשמר עליך, ולבקש לתקן או למחוק אותו. לכל בקשה או שאלה אפשר לפנות אל{' '}
          <Detail value={LEGAL.privacyEmail} missing="כתובת דוא״ל לפניות פרטיות" />.
        </p>
      </LegalSection>

      <LegalSection title="שמירה ואבטחה">
        <p>
          הפרטים נשמרים רק כל עוד הם נחוצים למטרות שתוארו כאן, ואנחנו נוקטים אמצעים סבירים כדי להגן עליהם. עם זאת, אין אפשרות להבטיח הגנה
          מוחלטת.
        </p>
      </LegalSection>

      <LegalSection title="שינויים במדיניות">
        <p>אם המדיניות תתעדכן, הנוסח החדש יפורסם בדף זה לצד תאריך העדכון.</p>
      </LegalSection>
    </LegalPage>
  )
}
