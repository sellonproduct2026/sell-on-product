SELL ON PRODUCT – ONLINE ADMIN VERSION

1) config.js खोलें।
   - SUPABASE_URL पहले से भरा है।
   - SUPABASE_ANON_KEY में Supabase की Publishable key (sb_publishable_...) डालें।
   - WHATSAPP_NUMBER में देश कोड सहित नंबर डालें, जैसे 919876543210।
   Secret/service_role key कभी न डालें।

2) GitHub repository में index.html, style.css, script.js, config.js चारों फाइलें अपलोड/replace करें। README_HI.txt केवल निर्देश के लिए है।

3) वेबसाइट refresh करें। Admin Login दबाएँ और वही email/password डालें जो Supabase Authentication > Users में बनाया था।

4) Admin panel में Brand, Model और Product जोड़ें। Product image upload भी यहीं से होगा।

महत्वपूर्ण:
- यह वेबसाइट Supabase JS v2 CDN का उपयोग करती है; इंटरनेट जरूरी है।
- SQL schema/policies पहले Supabase SQL Editor में चलाए गए होने चाहिए।
- आपने Automatically expose new tables बंद रखा था, इसलिए SQL Editor में यह अतिरिक्त grants एक बार चलाएँ:

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.brands, public.models, public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands, public.models, public.products TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

RLS policies फिर भी access को सीमित करती हैं। Admin user को public.admin_users में UID डालकर admin बनाया होना चाहिए।

फिलहाल Admin Panel में brand/model/product add और product show/hide उपलब्ध है। Product delete/edit और customer payment gateway अभी शामिल नहीं हैं।
