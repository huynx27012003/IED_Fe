import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC-miQogvucIgDdJo_2Qa8hZr8b5twvGas",
    authDomain: "attester-232cd.firebaseapp.com",
    projectId: "attester-232cd",
    storageBucket: "attester-232cd.appspot.com",
    messagingSenderId: "40617216257",
    appId: "1:40617216257:web:ca7bacc3f99878fb307300"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };