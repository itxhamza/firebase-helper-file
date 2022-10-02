import { async } from "@firebase/util";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { Collections } from "./Collections";
import { initFirebase } from "./init";
import { AuthResponse } from "./Responses/AuthResponse";
import { Response } from "./Responses/Response";
import { SnapShotResponse } from "./Responses/SnapShotResponse";
import { UserSchema } from "./Schemas";

class FirebaseHelper {
  constructor(firebaseConfig) {
    this.firebase = initFirebase(firebaseConfig);
    this.auth = this.firebase.auth();
    this.firestore = this.firebase.firestore();
  }

  generateDocId = (length = 28) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < length; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  };

  forgotPassword = async (email) => {
    try {
      const res = await sendPasswordResetEmail(this.auth, email);
      return Response(true, "Email Send Successfully", res);
    } catch (err) {
      return Response(false, err.message, err);
    }
  };

  createUser = async (email, password, userDetails = {}) => {
    try {
      let userData = {};
      UserSchema.map(async (item) => {
        Object.keys(userDetails).includes(item.key)
          ? (userData = { ...userData, [item.key]: userDetails[item.key] })
          : (userData = { ...userData, [item.key]: item.default ?? null });
      });

      const { user } = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      userData = { ...userData, uid: user.uid };

      const ref = doc(this.firestore, Collections.USER_RECORDS, user.uid);
      await setDoc(ref, userData);
      return AuthResponse(true, "User Created Successfully", userData);
    } catch (err) {
      return AuthResponse(false, err.message, err);
    }
  };

  loginUser = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const userData = await this.getUserData(user.uid);
      return AuthResponse(true, "User Sign In Successfully", userData.data);
    } catch (err) {
      return AuthResponse(false, err.message, err);
    }
  };

  getUserData = async (uid) => {
    try {
      const ref = doc(this.firestore, Collections.USER_RECORDS, uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const user = snapshot.data();
        return Response(true, "User Fetched Successfully", user);
      } else {
        return Response(false, "User Not Found", {});
      }
    } catch (err) {
      return Response(false, err.message, err);
    }
  };

  setData = async ({ collectionName, schema = [], docId = null }, data) => {
    try {
      if (!docId || docId.length == 0) {
        docId = this.generateDocId();
      }
      const ref = doc(this.firestore, collectionName, docId);

      let document = {};
      if (schema.length > 0) {
        schema.map(async (item) => {
          Object.keys(data).includes(item.key)
            ? (document = { ...document, [item.key]: data[item.key] })
            : (document = { ...document, [item.key]: item.default ?? null });
        });
      } else {
        document = data;
      }

      await setDoc(ref, document, { merge: true });
      return Response(true, "Data Added Successfully", document);
    } catch (err) {
      return Response(false, err.message, err);
    }
  };

  getData = async ({ collectionName, arrayFilter }) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.firestore, collectionName),
          ...arrayFilter.map((item) => {
            return where(item.key, item.operator, item.value);
          })
        )
      );
      const data = [];
      if (snapshot.empty) {
        return Response(false, "Data Not Found", []);
      }
      snapshot.forEach((doc) => {
        data.push({ docId: doc.id, ...doc.data() });
      });
      return Response(false, "Data Fetched Successfully", data);
    } catch (err) {
      return Response(false, "Unable To Fetch Document", err);
    }
  };

  getSpecificData = async (collectionName, docId) => {
    try {
      const ref = doc(this.firestore, collectionName, docId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        return Response(true, "Data Fetched Successfully", data);
      } else {
        return Response(false, "Data Not Found", {});
      }
    } catch (err) {
      return Response(false, "Unable To Fetch Document", err);
    }
  };

  getLiveData = ({ collectionName, arrayFilter }, callback) => {
    const data = [];
    const unsub = onSnapshot(
      query(
        collection(this.firestore, collectionName),
        ...arrayFilter.map((item) => {
          return where(item.key, item.operator, item.value);
        })
      ),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.empty) {
          callback(SnapShotResponse(true, "Data Not Found", unsub, []));
        }
        snapshot.forEach((doc) => {
          data.push({ docId: doc.id, ...doc.data() });
        });
        callback(
          SnapShotResponse(true, "Data Fetched Successfully", unsub, data)
        );
      }
    );
  };

  getLiveSpecificData = ({ collectionName, docId }, callback) => {
    const ref = doc(this.firestore, collectionName, docId);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.empty) {
          callback(SnapShotResponse(true, "Data Not Found", unsub, []));
        }
        callback(
          SnapShotResponse(
            true,
            "Data Fetched Successfully",
            unsub,
            snapshot.data()
          )
        );
      }
    );
  };
}

const helper = new FirebaseHelper({
  apiKey: "AIzaSyC2NFjewbq0jfJHY6pYTYlaYUn8SIQYQdo",
  authDomain: "fir-helperfile.firebaseapp.com",
  projectId: "fir-helperfile",
  storageBucket: "fir-helperfile.appspot.com",
  messagingSenderId: "604295354278",
  appId: "1:604295354278:web:0607d3bba98cc0b8d6e167",
  measurementId: "G-GXM95JGB1M",
});

export default helper;
