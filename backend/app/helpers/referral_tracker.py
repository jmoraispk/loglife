"""Referral tracking utilities.

This module provides functions for tracking and managing user referrals,
including saving referral records and counting referrals.
"""
import logging
<<<<<<< HEAD
from typing import Any
from app.db.sqlite import get_db
from app.helpers.whatsapp_sender import send_onboarding_msg
=======
from typing import Any, Dict
from app.db.sqlite import fetch_one, execute_query
from app.helpers.whatsapp_sender import send_onboarding_msg


def convert_waid_to_phone(waid: str) -> str:
    """
    Convert WhatsApp ID (WAID) to phone number format.
    
    Handles common country code conversions. Currently supports:
    - Pakistan (country code 92): Converts 923325727426 to 03325727426
    
    Args:
        waid (str): WhatsApp ID in international format
        
    Returns:
        str: Phone number in local format (or original WAID if no conversion applies)
    """
    # Pakistan: Remove country code 92 and add leading 0
    if waid.startswith('92') and len(waid) > 2:
        return '0' + waid[2:]
    
    # Add more country code conversions here as needed
    # Example for other countries:
    # if waid.startswith('1') and len(waid) == 11:  # US/Canada
    #     return waid[1:]  # Remove leading 1
    
    return waid
>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)


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
<<<<<<< HEAD
    send_result: dict[str, Any] = send_onboarding_msg(waid)
=======
    send_result: Dict[str, Any] = send_onboarding_msg(waid)
>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)
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
<<<<<<< HEAD
        db = get_db()
        cursor = db.cursor()
        
=======
>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)
        # Check if referral already exists
        existing = fetch_one("""
            SELECT id FROM referrals 
            WHERE referrer_phone = ? AND referred_phone = ?
        """, (referrer_phone, referred_phone))
        
<<<<<<< HEAD
        existing = cursor.fetchone()
=======
>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)
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
<<<<<<< HEAD
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) FROM referrals 
=======
        result = fetch_one("""
            SELECT COUNT(*) as count FROM referrals 
>>>>>>> 18f54b0 (Refactor, doc, and modularity updates: added docs build guide, improved code structure (imports, docstrings, helpers), refactored reminder system, centralized utilities, and renamed onboarding/timezone funcs.)
            WHERE referrer_phone = ?
        """, (referrer_phone,))
        
        return result['count'] if result else 0
        
    except Exception as e:
        logging.error(f"[REFERRAL] Failed to get referral count: {str(e)}")
        return 0
