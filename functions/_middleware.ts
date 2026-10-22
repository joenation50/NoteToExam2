export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  
  // Intercept the Google Auth redirect and send it to Firebase
  if (url.pathname.startsWith('/__/auth')) {
    const firebaseUrl = `https://notetoexam.firebaseapp.com${url.pathname}${url.search}`;
    return fetch(firebaseUrl, context.request);
  }
  
  // Let all other requests load your React app
  return context.next();
};
