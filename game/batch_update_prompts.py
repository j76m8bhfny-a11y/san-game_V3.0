#!/usr/bin/env python3
"""
批量更新事件图片提示词
- PC-98像素艺术风格
- 3:2比例 (960x640)
- 美国具体地点和纪实场景
- 以小见大
"""

import json
import os
import re

# 读取所有JSON事件
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
                events_data[event_id] = data
            except:
                continue

# 新提示词生成函数
def generate_prompt(event_id, title, text, category):
    """根据事件内容生成新的纪实风格提示词"""
    
    base_style = """PC-98 style, retro adventure game scene, pixel art, 1990s anime style,
16-bit color palette, dithering patterns, scanline effect,
3:2 aspect ratio (960x640),"""
    
    # 根据事件ID和text生成具体场景描述
    # 这里需要根据每个事件的具体内容来定制
    
    # 获取图片文件名
    image_path = events_data.get(event_id, {}).get('image', '')
    img_name = image_path.split('/')[-1].replace('.png', '') if image_path else ''
    
    return None, img_name  # 暂时返回None，后面会根据具体事件生成

# 事件场景映射表（关键事件的具体场景描述）
scene_descriptions = {
    # HOMELESS 阶级
    'evt_bench_spikes.png': 'San Francisco park, homeless person sitting on bench with metal anti-sleeping dividers, winter morning, fog rolling in from bay, discarded coffee cup on ground, bench has armrests preventing lying down',
    
    'evt_keypad_lock.png': 'Los Angeles public library restroom exterior, keypad entry lock on door, homeless person with shopping cart waiting outside, afternoon sun casting long shadows, concrete architecture',
    
    'evt_bleach_milk.png': 'Chicago alley behind supermarket, worker in apron pouring bleach into milk crate behind dumpster, early morning before opening, security camera visible, trash bags piled nearby',
    
    'evt_concrete_spikes.png': 'New York City sidewalk under bridge, concrete spikes installed to prevent sleeping, pigeon walking between spikes, commuter passing by with briefcase, gray morning light',
    
    'evt_arm_flower.png': 'Portland street corner, homeless person sitting on sidewalk holding small white flower found in trash, brick wall background, rain wet pavement, dignity in poverty moment',
    
    # WORKER 阶级
    'evt_pee_bottle.png': 'Amazon fulfillment center bathroom line, worker holding plastic bottle, shift supervisor watching, conveyor belts visible in background, warehouse fluorescent lighting, time clock on wall',
    
    'evt_diaper_worker.png': 'Tyson chicken plant production line, worker in uniform with visible adult diaper outline, no bathroom break sign on wall, industrial machinery, cold fluorescent lights',
    
    'evt_paystub_213.png': "Denny's diner back room, server looking at paystub showing $2.13/hour, tip jar on counter, customer waiting at register through doorway, worn linoleum floor",
    
    'evt_suited_spy.png': 'Auto factory floor, union meeting in progress, man in suit taking notes from catwalk, workers looking up suspiciously, industrial equipment, assembly line in background',
    
    'evt_oxycontin_pills.png': 'West Virginia coal mine break room, worker taking pills from bottle labeled OxyContin, injury visible on arm, mining helmet on table, company safety poster on wall',
    
    'evt_contract_sign.png': 'Silicon Valley tech company conference room, worker signing non-compete contract, lawyer pointing at clause, laptop with startup logo visible, glass walls showing open office',
    
    'evt_phone_waiting.png': 'Detroit autoworker home kitchen, worker staring at phone waiting for call, on-call schedule on refrigerator, kids toys on floor, clock showing 4 AM',
    
    'evt_loan_contract.png': 'Payday loan storefront interior, worker signing papers with magnifying glass, fine print visible, neon "Cash Advance" sign in window, security bars on door',
    
    'evt_fainted_driver.png': 'Uber driver car parked in McDonald's lot, driver slumped over steering wheel, phone showing earnings app, air conditioning not working, summer heat visible through windshield',
    
    'evt_kid_cleaning.png': 'Meatpacking plant night shift, child worker cleaning machinery, OSHA poster on wall, adult workers looking away, protective equipment too large',
    
    'evt_negative_paystub.png': 'Walmart break room, worker holding paystub showing negative balance after uniform deductions, vending machine in background, time clock showing end of shift',
    
    'evt_sleeping_in_car.png': 'Parking lot behind 24-hour Walmart, worker sleeping in back seat between shifts, alarm clock on dashboard, work uniform hanging in rear window, sunrise in background',
    
    'evt_robot_arm.png': 'GM assembly line, industrial robot arm replacing worker at welding station, worker watching from side with toolbox, union steward taking photos, factory floor',
    
    'evt_timer_red.png': 'Amazon warehouse bathroom entrance, worker looking at red bathroom break timer showing 2:45 remaining, scanner device in hand, queue forming behind, fulfillment center noise',
    
    'evt_headset_tears.png': 'Call center cubicle farm, worker crying while wearing headset, customer complaints audible, supervisor monitoring from elevated platform, beige partitions',
    
    # MIDDLE 阶级
    'evt_hoa_fine.png': 'Suburban Arizona driveway, homeowner reading HOA violation notice for lawn height, grass exactly 3.1 inches, measuring tape on ground, neighbors watching from window, desert landscaping',
    
    'evt_braces_bill.png': 'Orthodontist office reception, parent looking at $6000 braces estimate, child in waiting room playing with outdated magazine, dental chair visible through doorway, insurance form on counter',
    
    'evt_turbotax_screen.png': 'Home office tax preparation, TurboTax hidden fee disclosure on screen, credit card ready, W-2 forms spread on desk, clock showing 11 PM April 14th',
    
    'evt_diamond_ring.png': 'Kay Jewelers mall store, couple looking at engagement ring, price tag showing 3-month salary equivalent, mall food court visible through glass, credit card advertisement',
    
    'evt_giant_truck.png': 'Texas elementary school pickup line, massive lifted F-350 blocking visibility, children dwarfed by vehicle height, crossing guard trying to see around truck, American flag decal',
    
    'evt_school_map.png': 'Realtor office with school district map, redlined zones showing property values by school rating, concerned parents studying boundaries, Starbucks cups on table',
    
    'evt_organic_strawberry.png': 'Whole Foods produce section, shopper holding $8 organic strawberries, food stamps card visible in wallet, conventional strawberries $2.99 nearby, store lighting perfect',
    
    'evt_fico_score.png': 'Credit Karma app on phone showing score drop from 720 to 680, denial letter from mortgage lender on kitchen table, wine glass nearby, suburban kitchen',
    
    'evt_fancy_coffin.png': 'Funeral home selection room, grieving family looking at $15,000 mahogany casket, financing brochure on side table, cemetery pamphlet visible, soft organ music',
    
    'evt_essential_oils.png': 'Suburban living room, mother with Young Living essential oils doing presentation for friends, pyramid structure drawn on whiteboard, MLM product display',
    
    'evt_kid_van.png': 'Unmarked white van outside suburban home at night, teen being escorted by strangers in polo shirts, parents standing in doorway, "Troubled Teen" industry kidnapping',
    
    'evt_bill_shock.png': 'Living room couch, person holding $47,000 hospital bill for appendectomy, itemized charges showing $15 aspirin, insurance EOB showing "out of network" denial',
    
    'evt_white_savior.png': 'African village volunteer photo opportunity, white American teen posing with African children for Instagram, donation website on phone screen, villagers watching',
    
    'evt_crypto_crash.png': 'Dark basement with multiple monitors, Coinbase account showing -85% losses, margin call notification, energy drink cans, graduation photo on desk showing computer science degree',
    
    'evt_400_dollars.png': 'BMW service center, middle-class family unable to pay $400 brake repair, credit card declined at counter, car worth $40k visible through window, iPhone in hand',
    
    'evt_credit_card_declined.png': 'Whole Foods checkout line, credit card declined message on terminal, cart full of organic groceries, people waiting behind, Apple Watch showing fitness goals',
    
    # CAPITALIST 阶级
    'evt_lobbyist_bill.png': 'US Capitol Hill hallway, lobbyist handing drafted legislation to congressional aide, ALEC model policy folder visible, American flag in background, marble floors',
    
    'evt_bailout_check.png': 'Treasury Department ceremony, banker receiving oversized ceremonial check, taxpayers visible through window protesting, "Too Big to Fail" banner, suited officials applauding',
    
    'evt_revolving_door.png': 'Goldman Sachs building entrance, former SEC regulator entering through revolving door, protestors with "Regulatory Capture" signs outside, brass and marble lobby',
    
    'evt_carbon_credit.png': 'Chicago Mercantile Exchange trading floor, executive trading carbon credits, smokestacks visible on screens representing pollution permits, greenwashing brochure on desk',
    
    'evt_money_shredder.png': 'Corporate boardroom, machine shredding cash for stock buyback, shareholder value chart showing line up while employee headcount line down, mahogany table',
    
    'evt_po_box.png': 'Cayman Islands offshore office, wall of PO boxes numbered for shell companies, palm tree visible through window, American corporate logos on incorporation documents',
    
    'evt_private_jet.png': 'Davos airport tarmac, private jets lined up for climate conference, carbon offset certificates being printed inside, Swiss Alps in background, irony of environmentalism',
    
    'evt_phone_trade.png': 'Capitol Hill office, congressperson making stock trade on phone during classified briefing, laptop showing ticker symbols, American flag pin on lapel',
    
    'evt_welfare_queen_sign.png': 'Corporate headquarters lobby, executives receiving subsidies award while SNAP guide visible for comparison, Reagan portrait on wall, irony of corporate welfare',
    
    'evt_patent_troll.png': 'Delaware courthouse hallway, patent troll lawyer demanding settlement from small tech startup, vague patent document showing "method of doing business", intimidation tactic',
    
    'evt_child_miner.png': 'Congo cobalt mine, children working in dangerous tunnels, smartphones visible in supervisor's pocket, tech company logos on supply chain documents, exploitation for batteries',
    
    'evt_aaa_stamp.png': 'Moody's rating agency office, AAA stamp being applied to toxic mortgage CDO, bonus check on desk, 2008 financial crisis brewing, corruption in plain sight',
    
    'evt_blood_transfusion.png': 'Silicon Valley anti-aging clinic, billionaire receiving young blood transfusion, parabiosis equipment, medical tourism luxury, inequality literally in veins',
    
    'evt_land_owner.png': 'Billionaire ranch in Montana, land surveyor marking vast property boundaries, comparison to small European countries, neo-feudalism, largest private landowner',
    
    'evt_bunker_door.png': 'New Zealand luxury doomsday bunker, billionaire entering blast door while climate crisis news on phone, escape from problems they created, apocalypse inequality',
    
    # COMMON 通用事件
    'evt_heat_wave.png': 'Phoenix bus stop, 115 degree heat, unhoused person seeking shade under minimal shelter, heat shimmer visible, climate change reality, no air conditioning',
    
    'evt_flood.png': 'Houston suburban street underwater, submerged cars, family on roof waiting for rescue, climate disaster infrastructure failure, FEMA not yet arrived',
    
    'evt_smoke_sky.png': 'California residential neighborhood, orange sky from wildfire, air quality mask on person checking phone for evacuation order, climate change apocalypse',
    
    'evt_knife.png': 'Chicago alley at night, mugging in progress, victim handing over wallet, streetlight flickering, urban violence reality, survival desperation',
    
    'evt_broken_window.png': 'Suburban mall parking lot, car with smashed window, glass on ground, shopping bags stolen, security camera too late, property crime aftermath',
    
    'evt_credit_card.png': 'Identity theft victim on phone with bank, credit cards spread on table, police report visible, cyber crime paperwork, financial fraud nightmare',
    
    'evt_debt_collector.png': 'Kitchen table with multiple missed calls from collection agency, threatening letters opened, person staring at phone in anxiety, debt trap reality',
    
    'evt_coffin.png': 'Funeral home selection room, grieving family looking at casket price list, $8,000 minimum, "Direct Cremation" option circled, death industry exploitation',
    
    'evt_divorce_papers.png': 'Suburban kitchen table with signed divorce documents, wedding rings placed on papers, exhausted couple, legal dissolution cost $15,000',
    
    'evt_lottery_ticket.png': 'Gas station line for $500M Powerball, people clutching tickets, dreams of escape from economic reality, hope tax on the poor',
    
    'evt_tax_form.png': 'Dining table covered with three years of receipts, IRS audit letter, TurboTax printouts, accountant fees $5000 or risk prison, tax preparation nightmare',
}

# 默认描述生成器
def generate_scene_description(event_id, title, text, category, img_name):
    """根据事件内容生成纪实场景描述"""
    
    # 首先检查是否有预定义的场景
    if img_name in scene_descriptions:
        return scene_descriptions[img_name]
    
    # 根据事件text生成描述
    # 这里可以根据需要添加更多逻辑
    
    # 返回一个基于事件text的通用描述
    return f"American urban scene related to: {text[:100]}..." if text else f"Scene depicting {title} in American setting"

# 生成完整提示词
def generate_full_prompt(event_id, img_name):
    data = events_data.get(event_id, {})
    title = data.get('title', '')
    text = data.get('text', '')
    category = data.get('category', '')
    
    scene_desc = generate_scene_description(event_id, title, text, category, img_name)
    
    prompt = f"""PC-98 style, retro adventure game scene, pixel art, 1990s anime style,
16-bit color palette, dithering patterns, scanline effect,
3:2 aspect ratio (960x640),
{scene_desc},
diverse Americans of various ethnicities in authentic American urban setting,
wide angle establishing shot, full scene composition,
complete scene view, panoramic scene view,
no signs, no text, no labels, no placards, absolutely no written words or letters"""
    
    # 清理多余的空格和换行
    prompt = ' '.join(prompt.split())
    return prompt

# 主函数
print("=" * 80)
print("事件提示词生成器")
print("=" * 80)
print(f"\n共加载 {len(events_data)} 个事件\n")

# 显示几个示例
sample_events = [
    'EVT_CAPITALIST_11_WELFARE_QUEEN',
    'EVT_WORKER_01_PEE_BOTTLE', 
    'EVT_MIDDLE_01_HOA_FINE',
    'EVT_H01_BENCH_SPIKES',
    'EVT_C01_HEAT_WAVE'
]

print("示例提示词预览：\n")
for event_id in sample_events:
    if event_id in events_data:
        data = events_data[event_id]
        img = data.get('image', '').split('/')[-1].replace('.png', '')
        prompt = generate_full_prompt(event_id, img + '.png')
        print(f"【{event_id}】")
        print(f"图片: {img}.png")
        print(f"提示词: {prompt[:200]}...")
        print()

# 生成所有提示词
all_prompts = {}
for event_id, data in events_data.items():
    img_path = data.get('image', '')
    if img_path:
        img_name = img_path.split('/')[-1]
        prompt = generate_full_prompt(event_id, img_name)
        all_prompts[img_name] = {
            'id': event_id,
            'title': data.get('title', ''),
            'prompt': prompt
        }

print(f"\n共生成 {len(all_prompts)} 个提示词")
print("\n现在更新 ASSETS_EVENTS_PC98.md 文件...")
