import { mockCoupons, type Coupon } from '../data/mockData';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export interface User {
  name: string;
  email: string;
  mobile?: string;
  password?: string;
  isBanned?: boolean;
}

export type PurchaseItemType = 'combo' | 'subject-notes' | 'subject-quantum';

export interface Purchase {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile: string;
  courseId: string;
  courseName: string;
  itemType: PurchaseItemType;
  itemId: string; // The ID of the semester for combo, or the subject ID
  amount: number;
  date: string;
  timestamp: number;
  transactionId?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface SupportMessage {
  id: string;
  userName: string;
  userEmail: string;
  message: string;
  timestamp: number;
  reply?: string;
}

const PURCHASES_KEY = 'btech_purchases';
const USERS_KEY = 'btech_users';
const COUPONS_KEY = 'btech_coupons';
const SUPPORT_KEY = 'btech_support';

export const getCoupons = (): Coupon[] => {
  const data = localStorage.getItem(COUPONS_KEY);
  if (data) {
    return JSON.parse(data);
  } else {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(mockCoupons));
    return mockCoupons;
  }
};

export const saveCoupon = (coupon: Coupon) => {
  const coupons = getCoupons();
  if (!coupons.some(c => c.code === coupon.code)) {
    coupons.push(coupon);
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  }
};

export const deleteCoupon = (id: string) => {
  const coupons = getCoupons();
  const filtered = coupons.filter(c => c.id !== id);
  localStorage.setItem(COUPONS_KEY, JSON.stringify(filtered));
};

export const getPurchases = (): Purchase[] => {
  const data = localStorage.getItem(PURCHASES_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePurchase = (purchase: Purchase) => {
  // Save to localStorage for immediate local access
  const purchases = getPurchases();
  purchases.unshift(purchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));

  // Also save to Firestore so the Admin Panel gets real-time updates
  if (db) {
    setDoc(doc(db, 'purchases', purchase.id), purchase).catch(err =>
      console.error('Failed to save purchase to Firestore:', err)
    );
  }
};

export const deletePurchase = (id: string) => {
  const purchases = getPurchases();
  const filtered = purchases.filter(p => p.id !== id);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(filtered));
};

export const updatePurchaseStatus = (id: string, status: 'Pending' | 'Approved' | 'Rejected') => {
  // Update localStorage
  const purchases = getPurchases();
  const index = purchases.findIndex(p => p.id === id);
  if (index !== -1) {
    purchases[index].status = status;
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  }

  // Also update Firestore
  if (db) {
    updateDoc(doc(db, 'purchases', id), { status }).catch(err =>
      console.error('Failed to update purchase status in Firestore:', err)
    );
  }
};

export const hasPurchasedCourse = (email: string, courseId: string): boolean => {
  const purchases = getPurchases();
  return purchases.some(p => p.userEmail === email && p.courseId === courseId && p.status === 'Approved');
};

export const getPurchaseStatus = (email: string, courseId: string, itemType?: PurchaseItemType, itemId?: string): 'None' | 'Pending' | 'Approved' | 'Rejected' => {
  const purchases = getPurchases();
  // Sort by timestamp desc to get the latest attempt
  let relevantPurchases = purchases.filter(p => p.userEmail === email && p.courseId === courseId);
  
  if (itemType && itemId) {
    relevantPurchases = relevantPurchases.filter(p => p.itemType === itemType && p.itemId === itemId);
  }

  relevantPurchases.sort((a, b) => b.timestamp - a.timestamp);
  
  if (relevantPurchases.length > 0) {
    return relevantPurchases[0].status;
  }
  return 'None';
};


export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  if (!users.some(u => u.email === user.email)) {
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const toggleUserBan = (email: string, banStatus: boolean) => {
  const users = getUsers();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].isBanned = banStatus;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const updateUser = (oldEmail: string, updatedUser: User): { success: boolean, message: string } => {
  const users = getUsers();
  const index = users.findIndex(u => u.email === oldEmail);
  
  if (index === -1) {
    return { success: false, message: 'User not found.' };
  }
  
  // If email is being changed, check if new email is already taken
  if (oldEmail !== updatedUser.email && users.some((u, i) => i !== index && u.email === updatedUser.email)) {
    return { success: false, message: 'The new email address is already in use.' };
  }
  
  users[index] = updatedUser;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Also update email in purchases if it was changed
  if (oldEmail !== updatedUser.email) {
    const purchases = getPurchases();
    let madeChanges = false;
    for (const p of purchases) {
      if (p.userEmail === oldEmail) {
        p.userEmail = updatedUser.email;
        p.userName = updatedUser.name;
        madeChanges = true;
      }
    }
    if (madeChanges) {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
    }
  }
  
  
  return { success: true, message: 'Profile updated successfully.' };
};

export const getSupportMessages = (): SupportMessage[] => {
  const data = localStorage.getItem(SUPPORT_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSupportMessage = (message: SupportMessage) => {
  const messages = getSupportMessages();
  messages.unshift(message);
  localStorage.setItem(SUPPORT_KEY, JSON.stringify(messages));
};

export const replyToSupportMessage = (id: string, reply: string) => {
  const messages = getSupportMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index !== -1) {
    messages[index].reply = reply;
    localStorage.setItem(SUPPORT_KEY, JSON.stringify(messages));
  }
};
