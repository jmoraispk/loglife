"""Referral tracking utilities.

This module provides functions for tracking and managing user referrals,
including saving referral records and counting referrals.
"""
import logging
from typing import Any
from app.db.sqlite import get_db, fetch_one, execute_query
from app.helpers.whatsapp_sender import send_onboarding_msg


def process_referral(referrer_phone: str, waid: str) -> bool:
    """
    Process a referral: save to database and send onboarding message.
    
    This function handles the complete referral workflow:
    1. Saves referral to database
    2. Sends onboarding message to referred contact
    
    Args:
        referrer_phone (str): Phone number of person who shared contact
        waid (str): WhatsApp ID from VCARD data
        
    Returns:
        bool: True if referral was processed successfully, False otherwise
    """
    if not waid:
        logging.warning(f"[REFERRAL] Invalid WAID provided: {waid}")
        return False
    
    # Save referral to database
    save_success: bool = save_referral(referrer_phone, waid, waid)
    
    if not save_success:
        logging.error(f"[REFERRAL] Failed to save referral: {referrer_phone} -> {waid}")
        return False
    
    # Send onboarding message to the referred contact
    send_result: dict[str, Any] = send_onboarding_msg(waid)
    if send_result.get("success"):
        logging.debug(f"[REFERRAL] Onboarding message sent successfully to {waid}")
        return True
    else:
        logging.error(f"[REFERRAL] Failed to send onboarding message to {waid}: {send_result.get('error')}")
        # Still return True as referral was saved, even if message failed
        return True


def save_referral(referrer_phone: str, referred_phone: str, referred_waid: str) -> bool:
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
        # Check if referral already exists
        existing = fetch_one("""
            SELECT id FROM referrals 
            WHERE referrer_phone = ? AND referred_phone = ?
        """, (referrer_phone, referred_phone))
        
        if existing:
            logging.debug(f"[REFERRAL] Referral already exists: {referrer_phone} -> {referred_phone}")
            return True  # Return True since referral already exists
        
        # Save new referral
        execute_query("""
            INSERT INTO referrals (referrer_phone, referred_phone, referred_waid, status)
            VALUES (?, ?, ?, 'pending')
        """, (referrer_phone, referred_phone, referred_waid))
        
        logging.debug(f"[REFERRAL] Saved new referral: {referrer_phone} -> {referred_phone}")
        return True
        
    except Exception as e:
        logging.error(f"[REFERRAL] Failed to save referral: {str(e)}")
        return False


def get_referral_count(referrer_phone: str) -> int:
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
            SELECT COUNT(*) as count FROM referrals 
            WHERE referrer_phone = ?
        """, (referrer_phone,))
        
        result = cursor.fetchone()
        return result['count'] if result else 0
        
    except Exception as e:
        logging.error(f"[REFERRAL] Failed to get referral count: {str(e)}")
        return 0
