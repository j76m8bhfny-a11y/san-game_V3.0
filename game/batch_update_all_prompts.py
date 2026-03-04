#!/usr/bin/env python3
"""
批量更新所有事件提示词为纪实风格
"""

import json
import os
import re

# 读取所有事件JSON
events_dir = 'src/assets/data/events'
events_data = {}

for root, dirs, files in os.walk(events_dir):
    for file in files:
        if not file.endswith('.json') or file == 'index.ts':
            continue
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            try:
                data = json.load(f)
                event_id = data.get('id', file.replace('.json', ''))
                img = data.get('image', '').split('/')[-1] if data.get('image') else None
                if img:
                    events_data[img] = {
                        'id': event_id,
                        'title': data.get('title', ''),
                        'text': data.get('text', ''),
                        'category': data.get('category', '')
                    }
            except:
                continue

print(f"共加载 {len(events_data)} 个事件")

# 定义场景描述生成器
def generate_scene_description(img_name, data):
    """根据事件内容生成纪实场景描述"""
    title = data.get('title', '')
    text = data.get('text', '')
    category = data.get('category', '')
    event_id = data.get('id', '')
    
    # 基于事件ID和标题生成场景描述
    # 这里使用一个简单的映射，实际应用中可能需要更复杂的逻辑
    
    # HOMELESS 阶级事件
    if 'HOMELESS' in category or event_id.startswith('EVT_H'):
        return generate_homeless_scene(img_name, title, text)
    
    # WORKER 阶级事件
    elif 'WORKER' in category or event_id.startswith('EVT_WORKER'):
        return generate_worker_scene(img_name, title, text)
    
    # MIDDLE 阶级事件
    elif 'MIDDLE' in category or event_id.startswith('EVT_MIDDLE'):
        return generate_middle_scene(img_name, title, text)
    
    # CAPITALIST 阶级事件
    elif 'CAPITALIST' in category or event_id.startswith('EVT_CAPITALIST'):
        return generate_capitalist_scene(img_name, title, text)
    
    # COMMON 通用事件
    else:
        return generate_common_scene(img_name, title, text)

def generate_homeless_scene(img_name, title, text):
    """生成无家可归者场景"""
    scenes = {
        'evt_keypad_lock.png': 'Los Angeles public library exterior, keypad entry lock on restroom door, homeless person with shopping cart waiting outside, afternoon sun, concrete architecture',
        'evt_bleach_milk.png': 'Chicago alley behind supermarket, worker pouring bleach into milk crate, early morning, security camera, trash bags',
        'evt_concrete_spikes.png': 'New York City sidewalk under bridge, concrete spikes preventing sleeping, pigeon, commuter passing by, gray morning',
        'evt_one_way_ticket.png': 'Greyhound bus station, homeless person holding one-way ticket to unknown destination, plastic seats, fluorescent lights',
        'evt_wheelchair_dump.png': 'Hospital emergency exit, empty wheelchair dumped on sidewalk, medical waste nearby, glass doors',
        'evt_police_ticket.png': 'San Francisco street corner, police officer writing citation to homeless person sleeping on bench, pedestrians avoiding eye contact',
        'evt_blood_bag.png': 'Plasma donation center, donor chair with blood collection bag, low-income person earning $50 for donation, medical equipment',
        'evt_cold_sandwich.png': 'Homeless shelter food line, volunteer handing wrapped sandwich to person in line, metal trays, institutional setting',
        'evt_newspaper_pad.png': 'Highway overpass, homeless person lying on newspapers used as mattress, concrete pillars, traffic noise above',
        'evt_no_cash_sign.png': 'Coffee shop counter, homeless person holding cash being refused, card-only sign, modern interior',
        'evt_hobo_dog.png': 'City street corner, thin stray dog sitting beside homeless person, loyalty in poverty, urban backdrop',
        'evt_locked_dumpster.png': 'Supermarket back alley, padlocked dumpster, homeless person looking at discarded food inside, anti-scavenging',
        'evt_rejected_form.png': 'Welfare office, person holding rejected benefits application, bureaucratic desk, waiting room',
        'evt_handcuffs.png': 'City sidewalk, homeless person in handcuffs being arrested for camping, police cruiser, bystanders filming',
        'evt_tiktok_camera.png': 'Street corner, smartphone on tripod filming homeless person without consent, poverty tourism, exploitation',
        'evt_blue_pills.png': 'Dark alley, scattered blue fentanyl pills on ground, homeless person nearby, opioid epidemic',
        'evt_mass_grave.png': 'Hart Island potter\'s field, unmarked graves with wooden crosses, mass burial site for unclaimed bodies',
        'evt_handcuffed_volunteer.png': 'Public park, food distribution volunteer in handcuffs being arrested for feeding homeless, police, food table',
        'evt_covered_outlet.png': 'Park pavilion, electrical outlet with metal cover preventing phone charging, homeless person with dead phone',
        'evt_tow_truck.png': 'Street at night, tow truck hauling RV with someone living inside, predatory towing, homelessness criminalization',
        'evt_lean_bar.png': 'Bus shelter, leaning bar instead of bench, tired homeless person unable to lie down, hostile architecture',
        'evt_plastic_bags.png': 'Recycling center, homeless person carrying bags of plastic bottles for deposit, survival economy',
        'evt_shredder.png': 'Employment office, industrial shredder destroying job applications, bureaucratic rejection',
        'evt_excavator.png': 'Tent city under overpass, excavator demolishing homeless encampment, displacement, city cleanup',
        'evt_prescription.png': 'Pharmacy exterior, homeless person looking at unaffordable prescription prices, healthcare exclusion',
        'evt_cut_tree_stump.png': 'Public park, fresh tree stump where shade used to be, homeless person sitting in sun, anti-homeless measure',
        'evt_dirty_clothes.png': 'Laundromat exterior, homeless person with bags of dirty laundry, hygiene barriers',
        'evt_crying_child.png': 'Family shelter entrance, child crying while holding mother\'s hand, family separation crisis',
        'evt_security_robot.png': 'Shopping mall, security robot approaching homeless person, automated policing',
        'evt_urination_arrest.png': 'Alley corner, homeless person being arrested for public urination, no restroom access',
        'evt_pickup_truck_leave.png': 'Day labor site, pickup truck driving away without paying workers, wage theft',
        'evt_gavel.png': 'Courtroom, judge\'s gavel striking, homeless defendant, legal judgment',
        'evt_shed.png': 'Parking lot, tiny shed used as housing, inadequate shelter, urban poverty',
        'evt_cart_crushed.png': 'Street curb, crushed shopping cart with scattered belongings, property seizure',
        'evt_shady_recruiter.png': 'Labor pickup spot, shady recruiter approaching homeless workers, exploitation',
        'evt_security_wall.png': 'Mall exterior, security wall with spikes blocking sidewalk, homeless person excluded',
        'evt_headline_news.png': 'Street, homeless person reading newspaper about criminalization policies',
        'evt_pliers.png': 'Tent interior, homeless person using pliers for DIY dental work, healthcare desperation',
        'evt_working_addicts.png': 'Poultry plant, workers under influence of opioids, industrial labor, addiction crisis',
        'evt_error_page.png': 'Public library computer, error page on screen, homeless person unable to access services',
        'evt_water_jet.png': 'Sidewalk, high-pressure water spray clearing homeless encampment, street cleaning as displacement',
        'evt_metal_shutter.png': 'Storage facility, metal shutter coming down on living space, eviction',
        'evt_closed_shelter.png': 'Emergency shelter, closed doors with crowd outside during hurricane, no vacancy',
        'evt_school_bus_motel.png': 'Motel parking lot, school bus dropping off children living in motel, student homelessness',
        'evt_sharp_boulders.png': 'Under overpass, sharp rocks placed where homeless camped, hostile architecture',
        'evt_ambulance_bill.png': 'Ambulance interior, homeless person on stretcher holding massive medical bill',
        'evt_hydrant_lock.png': 'Street corner, fire hydrant with cage lock, homeless person with empty water container',
        'evt_screaming_child.png': 'Welfare office, child screaming while being taken by authorities, family separation',
        'evt_graffiti_wall.png': 'Alley, gang graffiti on wall, homeless person cautiously passing by',
        'evt_arm_flower.png': 'Portland street, homeless person holding small flower found in trash, dignity in poverty',
        'evt_fat_seagull.png': 'Dumpster area, overweight seagull scavenging while homeless person watches nearby',
        'evt_macbook_hobo.png': 'Library exterior, homeless person using MacBook on sidewalk, digital divide irony',
        'evt_bright_red_meat.png': 'Discount grocery, bright red dyed meat, homeless person looking at unaffordable food',
        'evt_food_poisoning.png': 'Alley, homeless person vomiting from contaminated dumpster food',
        'evt_shaking_hands.png': 'Tent, homeless person with shaking hands from alcohol withdrawal',
        'evt_sweat_bedsheet.png': 'Makeshift shelter, person waking from night terrors on sweat-soaked sheet',
        'evt_security_guard.png': 'Library entrance, security guard blocking homeless person, body odor discrimination',
        'evt_dry_fountain.png': 'Park plaza, dry public water fountain with removed spouts, 40-degree heat',
    }
    
    if img_name in scenes:
        return scenes[img_name]
    return f"American urban scene related to homelessness: {title}"

def generate_worker_scene(img_name, title, text):
    """生成工人阶级场景"""
    scenes = {
        'evt_diaper_worker.png': 'Tyson chicken plant, worker wearing adult diaper on production line, no bathroom breaks allowed',
        'evt_paystub_213.png': 'Denny\'s diner back room, server looking at $2.13/hour paystub, tip jar on counter',
        'evt_suited_spy.png': 'Auto factory, union meeting, man in suit taking notes from catwalk, union busting',
        'evt_oxycontin_pills.png': 'West Virginia coal mine, worker taking OxyContin in break room, injury visible',
        'evt_contract_sign.png': 'Tech company conference room, worker signing non-compete contract, lawyer present',
        'evt_phone_waiting.png': 'Detroit kitchen, autoworker staring at phone waiting for call at 4 AM, on-call schedule on fridge',
        'evt_loan_contract.png': 'Payday loan storefront, worker signing predatory loan with magnifying glass, fine print',
        'evt_fainted_driver.png': 'Uber driver car in McDonald\'s lot, driver slumped over wheel from heat, phone showing earnings',
        'evt_kid_cleaning.png': 'Meatpacking plant night shift, child worker cleaning machinery, OSHA poster on wall',
        'evt_contract_shredder.png': 'Corporate office, shredder destroying labor contract documents, union busting',
        'evt_orange_badge.png': 'Tech company lobby, temp worker with orange badge indicating second-class status',
        'evt_sick_worker.png': 'Fast food kitchen, sick worker coughing while preparing food, no sick leave',
        'evt_clock_display.png': 'Factory time clock, worker punching in, system rounding down minutes, wage theft',
        'evt_broken_phone.png': 'Street curb, gig driver with broken smartphone after accident, job loss',
        'evt_pink_slip.png': 'Office cubicle, worker receiving pink slip termination notice, layoff',
        'evt_negative_paystub.png': 'Warehouse break room, worker holding negative balance paystub after deductions',
        'evt_check_nda.png': 'Corporate meeting room, worker signing NDA for hush money check, silence purchase',
        'evt_sleeping_in_car.png': 'Parking lot at dawn, worker sleeping in car between clopening shifts, uniform hanging',
        'evt_swollen_legs.png': 'Retail checkout, cashier with swollen legs from standing all day, no right to sit',
        'evt_cold_pizza.png': 'Warehouse break room, boss distributing cold pizza to workers as appreciation',
        'evt_robot_arm.png': 'GM assembly line, robot arm replacing worker at welding station, automation displacement',
        'evt_timer_red.png': 'Amazon warehouse, worker looking at red bathroom break timer showing 2:45 remaining',
        'evt_silence_sign.png': 'Assembly line floor, workers in silence under "NO TALKING" sign, communication ban',
        'evt_duct_tape_mask.png': 'Chemical plant, worker with respirator held together by duct tape, broken PPE',
        'evt_locked_door.png': 'Factory exit, exit door chained and padlocked, workers trapped for forced overtime',
        'evt_empty_wallet.png': 'Modest home, elderly worker holding empty leather wallet, pension stolen',
        'evt_boss_speech.png': 'Break room, boss giving "we\'re family" speech to tired workers, corporate propaganda',
        'evt_superglue_wound.png': 'Warehouse floor, worker using super glue to seal cut on hand, no health insurance',
        'evt_prison_factory.png': 'Prison factory floor, inmates working alongside outside workers, exploitative labor',
        'evt_headset_tears.png': 'Call center cubicle, worker crying while wearing headset, emotional labor exploitation',
        'evt_duct_tape_repair.png': 'Warehouse, forklift dangerously repaired with duct tape, OSHA neglect',
        'evt_lone_cashier.png': 'Convenience store night, lone cashier handling everything, skeleton crew',
        'evt_contractor_badge.png': 'Gig company office, driver with "Independent Contractor" badge, misclassification',
        'evt_biometric_scan.png': 'Warehouse bathroom entrance, worker using fingerprint scanner for bathroom access',
        'evt_signature_pen.png': 'Hiring office, worker signing at-will employment contract with pen, precarious work',
        'evt_heavy_tray.png': 'Busy restaurant, pregnant waitress struggling with heavy tray, no maternity leave',
        'evt_rent_hike_notice.png': 'Mobile home park, resident reading drastic rent increase notice, mobile home trap',
        'evt_cardboard_box.png': 'Office building exit, fired employee carrying cardboard box of belongings, layoff',
        'evt_gas_mask_kid.png': 'Industrial neighborhood, child wearing gas mask walking to school, Cancer Alley pollution',
        'evt_passport_stack.png': 'Recruiting office, immigrant workers with confiscated passports, visa bondage',
        'evt_canned_food.png': 'Convenience store, worker buying only canned goods, food desert, no fresh food',
        'evt_scratch_off.png': 'Gas station counter, worker buying lottery scratch-off ticket, poverty tax',
        'evt_scab_bus.png': 'Factory picket line, bus with strikebreakers crossing picket line, union busting',
        'evt_kneeling_worker.png': 'Manager office, worker kneeling begging for job, humiliation, power abuse',
        'evt_arm_needle.png': 'Factory bathroom, worker injecting in arm with visible needle marks, workplace addiction',
        'evt_coat_hanger.png': 'Motel room, desperate worker holding wire coat hanger, lack of healthcare access',
        'evt_tap_water.png': 'Kitchen sink, worker watching brown contaminated tap water running, infrastructure neglect',
        'evt_sugar_donut.png': 'Break room, worker eating sugary donut, processed food dependence',
        'evt_severed_finger.png': 'Factory floor, severed finger on ground, supervisor calling Uber instead of ambulance',
        'evt_scanner_red.png': 'Amazon warehouse aisle, handheld scanner showing red "TOT TIMEOUT" termination alert',
        'evt_manager_stealing.png': 'Restaurant back room, manager taking half of tip jar for "administrative fees"',
        'evt_debit_card.png': 'Warehouse break room, worker holding company pay card showing fee deductions',
        'evt_anti_union_flyer.png': 'Factory parking lot, anti-union organizer handing out "Right-to-Work" flyers',
    }
    
    if img_name in scenes:
        return scenes[img_name]
    return f"American workplace scene related to labor exploitation: {title}"

def generate_middle_scene(img_name, title, text):
    """生成中产阶级场景"""
    scenes = {
        'evt_braces_bill.png': 'Orthodontist office, parent looking at $6000 braces bill, child in waiting room',
        'evt_turbotax_screen.png': 'Home office, TurboTax hidden fees on screen, W-2 forms spread on desk, April 14th',
        'evt_diamond_ring.png': 'Kay Jewelers store, couple looking at engagement ring, 3-month salary price',
        'evt_giant_truck.png': 'Texas school pickup line, massive lifted F-350 blocking visibility, children dwarfed',
        'evt_school_map.png': 'Realtor office, parents studying school district map with redlined zones, segregation',
        'evt_organic_strawberry.png': 'Whole Foods produce, shopper holding $8 organic strawberries, food stamps card visible',
        'evt_fico_score.png': 'Credit Karma app showing score drop from 720 to 680, denial letter on table',
        'evt_fancy_coffin.png': 'Funeral home, family at $15,000 casket display, financing brochure on side table',
        'evt_essential_oils.png': 'Suburban living room, mother doing MLM essential oils presentation, pyramid on whiteboard',
        'evt_fake_service_dog.png': 'Upscale grocery, person with dog in fake service vest, entitlement fraud',
        'evt_nimby_sign.png': 'Suburban front yard, "Keep Our Neighborhood Nice" sign, NIMBY hypocrisy',
        'evt_credit_card_maxed.png': 'Upscale restaurant, embarrassment as credit card declined, middle class precarity',
        'evt_wine_tumbler.png': 'Suburban kitchen, mother with stemless wine tumbler, hidden alcoholism',
        'evt_fishbowl_boss.png': 'Open plan office, manager in glass walled office watching workers, surveillance',
        'evt_uber_professor.png': 'University parking lot at night, adjunct professor getting into car for Uber shift',
        'evt_gofundme_page.png': 'Hospital waiting room, person creating GoFundMe on laptop for medical bills',
        'evt_timeshare_contract.png': 'Florida resort, couple signing timeshare contract under high pressure sales',
        'evt_police_server.png': 'Police data center, Ring doorbell surveillance data flowing to servers',
        'evt_ritalin_bottle.png': 'Suburban kitchen, parent giving Ritalin to child before school, ADHD overdiagnosis',
        'evt_bill_shock.png': 'Living room sofa, person holding $47,000 hospital bill for minor treatment',
        'evt_cash_hand.png': 'Suburban doorway, under-the-table cash payment to nanny, tax evasion gray economy',
        'evt_coffee_tray.png': 'Hipster cafe, person carrying tray with expensive lattes, gentrification marker',
        'evt_car_keys.png': 'Car dealership, buyer receiving new car keys, 7-year loan trap',
        'evt_latte_art.png': 'Trendy coffee shop, person photographing latte art for Instagram, displacement symbolism',
        'evt_rejection_letter.png': 'Suburban bedroom, teenager devastated by Ivy League rejection letter',
        'evt_pill_cup.png': 'Nursing home room, nurse giving cup full of pills to sedated elderly patient',
        'evt_negative_balance.png': 'Home office, person looking at negative bank account with cascading fees',
        'evt_white_savior.png': 'African village, white tourist posing with children for Instagram, voluntourism',
        'evt_paystub_tax.png': 'Kitchen table, couple comparing W-2 tax burden with wealthy tax loopholes',
        'evt_fake_smile.png': 'Corporate office, workers with forced smiles doing team building, emotional labor',
        'evt_wooden_toys.png': 'Waldorf classroom, children with expensive wooden toys, tech-free elite education',
        'evt_lawyer_smiling.png': 'Law firm conference room, divorce lawyer grinning at distraught client, $500/hour',
        'evt_teacher_driver.png': 'School parking lot evening, teacher getting into car for Uber shift',
        'evt_pill_bottles.png': 'Suburban bathroom, multiple pill bottles on counter, benzodiazepine dependence',
        'evt_karen_phone.png': 'Public park BBQ area, suburban woman calling police on Black family having barbecue',
        'evt_yoga_pants.png': 'Luxury gym entrance, woman in Lululemon yoga pants, body fascism',
        'evt_denied_stamp.png': 'Insurance office, stamp hitting medical claim with "DENIED", prior authorization rejection',
        'evt_bulletproof_bag.png': 'School entrance, child wearing bulletproof backpack, active shooter drills normalized',
        'evt_seizure_letter.png': 'Family home, elderly woman receiving Medicaid estate recovery notice, house seizure',
        'evt_photoshop_sport.png': 'Photo studio, photoshopped crew team photo being created for college application fraud',
        'evt_traffic_jam_coffee.png': 'Highway traffic jam at dawn, commuter with coffee cup in car, 2-hour drive each way',
        'evt_crypto_crash.png': 'Dark room with monitors, crypto trading crash wiping out savings, gambling addiction',
        'evt_kid_van.png': 'Suburban home at night, teen being forced into unmarked van by strangers, troubled teen industry',
        'evt_red_truck_private.png': 'Wildfire scene, private firefighting truck protecting mansion while neighbors burn',
        'evt_ceo_screen.png': 'Home office, worker watching Zoom mass firing by CEO, digital layoff',
        'evt_handshake_secret.png': 'Back office, manager secret handshake with worker promising fake promotion',
        'evt_400_dollars.png': 'Empty checking account screen showing $400 balance, middle class precarity',
        'evt_burning_boxes.png': 'Suburban backyard bonfire, person burning boxes of tax documents, audit fear',
        'evt_confusing_contract.png': 'Hospital waiting area, patient trying to read incomprehensible medical contract',
        'evt_yacht_loan.png': 'Marina dock, person holding loan papers for luxury yacht they cannot afford',
        'evt_loan_statement.png': 'Doctor office desk, 35-year-old physician looking at $180k student loan statement',
        'evt_war_stocks.png': 'Suburban home office, father reviewing 401k showing Raytheon and GEO Group holdings',
        'evt_manager_badge.png': 'Fast food kitchen, fry cook with "Assistant Manager" badge working 60-hour weeks',
        'evt_credit_card_declined.png': 'BMW dealership service center, middle-class family unable to pay $400 repair bill',
    }
    
    if img_name in scenes:
        return scenes[img_name]
    return f"American middle class scene related to precarity: {title}"

def generate_capitalist_scene(img_name, title, text):
    """生成资本家场景"""
    # 已更新的关键事件
    updated = {
        'evt_snap_guide.png': 'Ohio Walmart employee break room, African American female worker in blue vest filling out SNAP benefits application on phone, microwave with discounted frozen dinner, Wall Street Journal showing "Walmart Profits Hit $150B", CRT television showing CEO interview about "job creation", vending machine with cheap snacks',
        'evt_vulture_suit.png': 'Indiana manufacturing plant locker room, workers gathered around posted "Plant Closure Notice", cardboard boxes being packed, tow trucks in parking lot removing company trucks, veteran worker of 20 years sitting on bench holding family photograph',
        'evt_money_speech.png': 'Washington DC K Street upscale steakhouse private booth, lobbyist and congressman sitting side by side, amendment draft on table, folded Super PAC donor list beside it, US Capitol dome visible through window',
        'evt_insulin_vial.png': 'Minnesota CVS pharmacy insulin refrigerator section, middle-aged mother holding prescription and phone calculator, price showing increase from $300 to $330, pharmacist on phone with insurance, shopping basket with child lunchbox',
    }
    
    if img_name in updated:
        return updated[img_name]
    
    scenes = {
        'evt_lobbyist_bill.png': 'US Capitol Hill hallway, lobbyist handing drafted legislation to congressional aide, ALEC folder visible',
        'evt_bailout_check.png': 'Treasury Department ceremony, banker receiving oversized ceremonial check, taxpayers protesting outside window',
        'evt_revolving_door.png': 'Goldman Sachs building entrance, former SEC regulator entering through revolving door',
        'evt_carbon_credit.png': 'Chicago Mercantile Exchange trading floor, executive trading carbon credits, pollution permits',
        'evt_money_shredder.png': 'Corporate boardroom, machine shredding cash for stock buyback, shareholder value chart',
        'evt_po_box.png': 'Cayman Islands offshore office, wall of PO boxes for shell companies, palm tree through window',
        'evt_angry_emoji.png': 'Social media control room, algorithm creating enraged emoji reactions, rage engagement manipulation',
        'evt_private_jet.png': 'Davos airport, private jets lined up for climate conference, carbon inequality hypocrisy',
        'evt_phone_trade.png': 'Capitol Hill office, congressperson making stock trade on phone during classified briefing',
        'evt_broken_bulb.png': 'Lightbulb factory boardroom, executives with deliberately limited lifespan bulb design, planned obsolescence',
        'evt_judge_gavel.png': 'Juvenile courtroom, judge accepting cash bribe under gavel, kids for cash scandal',
        'evt_patent_troll.png': 'Delaware courthouse hallway, patent troll demanding settlement from small tech innovator',
        'evt_charity_check.png': 'Museum gala, billionaire presenting oversized charity check for photo op, tax write-off',
        'evt_nestle_pump.png': 'Dry riverbed, Nestle industrial water pump extracting remaining water, water theft',
        'evt_sinclair_anchor.png': 'News studio, anchor forced to read identical corporate script, media consolidation propaganda',
        'evt_consultant_shark.png': 'Corporate boardroom, McKinsey consultant with shark-like demeanor advising bankruptcy',
        'evt_liberia_flag.png': 'Shipping office, Liberian flag of convenience being registered for vessel, labor law evasion',
        'evt_user_data.png': 'Tech company data center, visualization of user data being extracted from people',
        'evt_rent_graph.png': 'Property management office, executives watching rent price skyrocket on algorithm',
        'evt_vulture_suit.png': 'Indiana manufacturing plant locker room, workers gathered around posted "Plant Closure Notice", tow trucks removing company trucks, veteran worker of 20 years holding family photograph',
        'evt_split_company.png': 'Law firm conference room, company splitting into two entities to evade liability, Texas two-step',
        'evt_blackrock_sign.png': 'Suburban neighborhood, Blackrock sign on multiple acquired houses, institutional landlord',
        'evt_missile_deal.png': 'Pentagon office, defense contractor shaking hands with general over missile deal, revolving door',
        'evt_money_speech.png': 'Washington DC K Street steakhouse private booth, lobbyist and congressman with amendment draft and Super PAC donor list, Capitol dome visible',
        'evt_fake_protest_sign.png': 'Staged protest with identical professionally made signs, astroturfing manufactured dissent',
        'evt_water_drop_gold.png': 'Commodity trading floor, water droplet being traded as gold commodity, futures trading',
        'evt_fine_print.png': 'Contract with microscopic fine print under magnifying glass, unreadable terms',
        'evt_light_switch_off.png': 'Power plant control room, hand deliberately turning off light switch for blackout, Enron manipulation',
        'evt_terminator_seed.png': 'Biotech lab, GMO terminator seed design with suicide gene, farmer dependency',
        'evt_burning_bag.png': 'Luxury goods warehouse, burning bag of unsold expensive merchandise, artificial scarcity',
        'evt_sugar_check.png': 'Research lab, scientist receiving large check from sugar industry for favorable study',
        'evt_child_miner.png': 'Congo cobalt mine, child miners working in dangerous conditions, blood batteries for tech',
        'evt_mercenary.png': 'War zone checkpoint, private military contractor with corporate logo, war outsourcing',
        'evt_aaa_stamp.png': 'Rating agency office, AAA stamp being applied to junk bond, fraudulent rating',
        'evt_buyout_check.png': 'Startup office, giant corporation presenting acquisition check to kill innovation',
        'evt_credit_card_terminal.png': 'Retail checkout, credit card swipe terminal with hidden fee extraction visualization',
        'evt_nurse_salesman.png': 'African village clinic, nurse in uniform pushing formula samples on new mothers, Nestle predation',
        'evt_wrapped_picasso.png': 'Swiss freeport vault, wrapped Picasso painting being stored for tax evasion',
        'evt_insurance_payout.png': 'Corporate boardroom, executives celebrating dead peasant insurance payout check',
        'evt_blood_transfusion.png': 'Silicon Valley anti-aging clinic, billionaire receiving young blood transfusion, parabiosis',
        'evt_land_owner.png': 'Montana ranch, billionaire surveying vast land holdings, neo-feudalism, largest private landowner',
        'evt_developer_contract.png': 'Maui fire devastation, developer offering contract to displaced homeowners, disaster capitalism',
        'evt_starship_ticket.png': 'Luxury launch facility, billionaire holding Mars colonization ticket, escape fantasy',
        'evt_bunker_door.png': 'New Zealand countryside, billionaire entering luxury doomsday bunker blast door, apocalypse inequality',
        'evt_sea_city.png': 'Ocean platform, seasteading artificial island as sovereign micronation, billionaire escape',
        'evt_rent_everything.png': 'Person surrounded by subscription service logos for everything, ownership society ended',
        'evt_collar_blueprint.png': 'Tech company design lab, explosive worker control collar blueprint on screen, dystopian surveillance',
        'evt_vr_headset.png': 'Futuristic pod apartment, person permanently connected to VR headset, matrix escapism',
        'evt_incubator_box.png': 'Biotech facility, rows of artificial womb incubators for baby production, human livestock farming',
        'evt_hobo_stock.png': 'Trading floor, homeless person depicted as stock ticker for human futures trading',
        'evt_dark_house.png': 'Residential neighborhood at night, house dark while neighbor\'s AI data center glows, energy inequality',
        'evt_peanut_shells.png': 'Peanut butter factory, contaminated product with salmonella from cost cutting',
    }
    
    if img_name in scenes:
        return scenes[img_name]
    return f"American corporate scene related to capitalism: {title}"

def generate_common_scene(img_name, title, text):
    """生成通用场景"""
    scenes = {
        'evt_mirror_wrinkles.png': 'Bathroom mirror, middle-aged person watching wrinkles reappear as anti-aging effect fades, mortality realization',
        'evt_heat_wave.png': 'Phoenix bus stop at 115 degrees, unhoused person seeking minimal shade, heat shimmer visible',
        'evt_flood.png': 'Houston suburban street underwater, submerged cars, family on roof waiting for rescue, climate disaster',
        'evt_smoke_sky.png': 'California residential neighborhood with orange sky from wildfire, air quality mask, evacuation order',
        'evt_vomit.png': 'Apartment bathroom, person vomiting from food poisoning, takeout containers visible',
        'evt_medicine.png': 'Drugstore interior, empty cold medicine shelves, people in masks coughing, flu season chaos',
        'evt_bedbug.png': 'Bedroom with mattress lifted, visible bed bugs crawling, person with red bite marks on arms',
        'evt_knife.png': 'Chicago alley at night, masked robber with knife confronting victim, urban violence',
        'evt_broken_window.png': 'Parking lot at night, car with shattered window, stolen items, owner discovering damage',
        'evt_credit_card.png': 'Home office, person on phone with bank about identity theft, credit cards spread on desk',
        'evt_router.png': 'Living room, person frantically rebooting internet router, all devices showing no connection',
        'evt_algorithm.png': 'Person looking at phone with targeted ad matching recent conversation, algorithmic surveillance',
        'evt_credit_report.png': 'Person staring at computer showing credit score drop from 720 to 670, denied loan visible',
        'evt_overdraft_fee.png': 'ATM screen showing $3 overdraft with $35 fee, person in disbelief, poverty tax',
        'evt_debt_collector.png': 'Kitchen table, person receiving aggressive debt collector call, multiple missed calls on phone',
        'evt_coffin.png': 'Funeral home showroom, grieving family at casket display with price tags, $8,000 minimum',
        'evt_will.png': 'Lawyer office, person receiving inheritance notification letter, estate tax forms piled on desk',
        'evt_divorce_papers.png': 'Kitchen table with signed divorce papers, rings placed on documents, exhausted couple',
        'evt_lottery_ticket.png': 'Gas station line for $500M Powerball, people clutching tickets, dreams of escape',
        'evt_slot_machine.png': 'Casino floor with flashing slot machines, person inserting last coins, gambling addiction',
        'evt_tax_form.png': 'Dining table covered with three years of receipts, IRS audit letter in hand, tax preparation chaos',
    }
    
    if img_name in scenes:
        return scenes[img_name]
    return f"American urban scene: {title}"

# 生成完整提示词
def generate_full_prompt(img_name, data):
    scene_desc = generate_scene_description(img_name, data)
    
    prompt = f"""PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), {scene_desc}, diverse Americans of various ethnicities in authentic American urban setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters"""
    
    return ' '.join(prompt.split())

# 更新MD文件
print("开始批量更新提示词...")

with open('docs/ASSETS_EVENTS_PC98.md', 'r') as f:
    content = f.read()

updated_count = 0
for img_name, data in events_data.items():
    if img_name not in content:
        continue
    
    # 检查是否已经更新
    if '3:2 aspect ratio' in content and img_name in content:
        # 检查这个位置是否已经有新格式
        idx = content.find(img_name)
        next_section = content[idx:idx+500]
        if '3:2 aspect ratio' in next_section:
            continue
    
    # 生成新提示词
    new_prompt = generate_full_prompt(img_name, data)
    
    # 替换旧提示词
    pattern = rf"(\| `{re.escape(img_name)}` \| \d+x\d+ \| [^|]+ \| )(.+?)( \|)(?![^|]*\|)"
    
    def replacer(match):
        return match.group(1) + new_prompt + match.group(3)
    
    new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        content = new_content
        updated_count += 1
        if updated_count % 50 == 0:
            print(f"  已更新 {updated_count} 个事件...")

# 保存
with open('docs/ASSETS_EVENTS_PC98.md', 'w') as f:
    f.write(content)

print(f"\n✅ 共更新 {updated_count} 个事件提示词")
print("文档已保存")
EOF
