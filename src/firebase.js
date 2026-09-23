import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBBn1_B3qG-WBQm_z01ADWj3m4UplC-pRk',
  authDomain: 'freestyle-b4379.firebaseapp.com',
  projectId: 'freestyle-b4379',
  storageBucket: 'freestyle-b4379.firebasestorage.app',
  messagingSenderId: '145051480784',
  appId: '1:145051480784:web:3b54b3375ad1f45051a4d5',
  measurementId: 'G-JR1HDWHPW2'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = isSupported()
  .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
  .catch(() => null);
