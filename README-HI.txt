SELL ON PRODUCT — नया frontend package

इस ZIP में index.html, style.css, script.js और config.js हैं।

शुरू करने से पहले:
1. config.js में अपने मौजूदा Supabase Project URL और Publishable/anon key भरें।
2. Service Role या Secret key कभी public GitHub code में न डालें।
3. यह package existing tables brands, models, products, admin_users और storage bucket product-images मानकर बनाया गया है।
4. Default columns: brands(name_en,name_hi), models(brand_id,name), products(brand_id,model_id,name,type,price,stock,image_url,image_urls), admin_users(user_id)।
5. आपके पुराने database में column names अलग हों तो config.js के COLUMNS mapping को वास्तविक नामों के अनुसार बदलना होगा। पुराने database को reset/delete न करें।

GitHub:
चारों फाइलें repository के root में upload/replace करें। config.js में अपनी वास्तविक keys रखें। फिर GitHub Pages deploy होने दें और Incognito में test करें।

महत्वपूर्ण सीमाएँ:
- WhatsApp checkout ग्राहक के WhatsApp में तैयार संदेश खोलता है; Send ग्राहक को दबाना होगा।
- वास्तविक WhatsApp automatic reply के लिए WhatsApp Business Platform/API और सुरक्षित backend चाहिए।
- इस frontend में वेबसाइट के अंदर order dashboard/automatic order storage अभी शामिल नहीं है; उसके लिए orders table और secure backend workflow बनाना होगा।
- Public catalog देखने के लिए Supabase में brands/models/products पर SELECT policies और image upload के लिए Storage policies जरूरी हैं।
- Admin sign-in के बाद admin_users table में user_id होना चाहिए।
- यह starter code है, आपके वास्तविक schema/RLS से मिलान और test के बाद ही live करें।

डेटाबेस मिलान (आपके बताए कॉलम के अनुसार):
- brands: id, name_en, name_hi, created_at
- models: id, brand_id, model_name, created_at
- products: id, model_id, title, cover_type, price, stock, image_url, is_active, created_at, image_urls (text)
- admin_users: user_id
- image_urls में कई फोटो JSON text के रूप में सेव होंगे।

ध्यान दें: यह फ्रंटएंड आपके बताए कॉलम के अनुसार सेट किया गया है। Supabase की मौजूदा RLS policies और Storage bucket permissions को बदले बिना लाइव वेबसाइट पर permissions की वजह से कोई काम रुक सकता है। इस ZIP में order WhatsApp message खोलता है; अपने-आप WhatsApp message भेजना/automatic reply चलाना इसमें शामिल नहीं है।
