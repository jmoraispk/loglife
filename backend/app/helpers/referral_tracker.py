import sqlite3
import logging
from app.db.sqlite import get_db


def save_referral(referrer_phone, referred_phone, referred_waid):
    """
    Save a referral record to the database.
    Checks for existing referral to prevent duplicates.
    
    Args:
        referrer_phone (str): Phone number of person who shared contact
        referred_phone (str): Phone number of person who was referred
        referred_waid (str): WhatsApp ID from VCARD data
        
    Returns:
        bool: True if saved successfully, False otherwise
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Check if referral already exists
        cursor.execute("""
            SELECT id FROM referrals 
            WHERE referrer_phone = ? AND referred_phone = ?
        """, (referrer_phone, referred_phone))
        
        existing = cursor.fetchone()
        if existing:
            logging.debug(f"[REFERRAL] Referral already exists: {referrer_phone} -> {referred_phone}")
            return True  # Return True since referral already exists
        
        # Save new referral
        cursor.execute("""
            INSERT INTO referrals (referrer_phone, referred_phone, referred_waid, status)
            VALUES (?, ?, ?, 'pending')
        """, (referrer_phone, referred_phone, referred_waid))
        
        db.commit()
        logging.debug(f"[REFERRAL] Saved new referral: {referrer_phone} -> {referred_phone}")
        return True
        
    except Exception as e:
        logging.error(f"[REFERRAL] Failed to save referral: {str(e)}")
        return False


def get_referral_count(referrer_phone):
    """
    Get the number of referrals made by a user.
    
    Args:
        referrer_phone (str): Phone number of the referrer
        
    Returns:
        int: Number of referrals made
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) FROM referrals 
            WHERE referrer_phone = ?
        """, (referrer_phone,))
        
        count = cursor.fetchone()[0]
        return count
        
    except Exception as e:
        logging.error(f"[REFERRAL] Failed to get referral count: {str(e)}")
        return 0
