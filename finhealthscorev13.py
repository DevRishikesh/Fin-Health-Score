def main():
    datas = get_inputs() 
    summary = aggregate_data(datas) 
    ratios = calculate_ratios(summary) 
    total_score = calculate_scores(ratios) 
    health_score = evaluate_fin_health(total_score)
    swot = generate_swot(total_score,ratios)
    action=generate_actions(ratios,total_score)
    display_output(summary,ratios,total_score,health_score,swot,action)
     


  

def get_inputs():
    print("****************Enter your Monthly income and expenses*************** ")
    monthly_income = float(input("Monthly Income: "))
    spouse_monthly_income = float(input("Spouse Monthly Income: "))
    print("****************Fixed expenses****************")
    rent = float(input("Rent: "))
    food_groceries = float(input("Food and Groceries: "))
    electricity = float(input("Electricity: "))
    loan_emi = float(input("Loan/EMI: "))
    maid_help = float(input("Maid/Help: "))
    fuel = float(input("Fuel: "))
    medical = float(input("Medical: "))
    wifi_ott = float(input("Wifi/OTT: "))
    phone_recharge = float(input("Phone Recharge: "))
    entertainment = float(input("Entertainment: "))
    shopping = float(input("Shopping: "))
    miscellaneous = float(input("Miscellaneous: "))
    print("****************Financial protection****************")
    emg=float(input("How much emergency fund you have: "))
    health=input("Do you have health insurance:? (y/n) ").lower()
    life_term=input("Do you have Life/Term insurance:? (y/n) ").lower()

    return monthly_income,spouse_monthly_income,rent,food_groceries,electricity,loan_emi,maid_help,fuel,medical,wifi_ott,phone_recharge,entertainment,shopping,miscellaneous,emg,health,life_term


    ...


def aggregate_data(inputs):
    monthly_income,spouse_monthly_income,rent,food_groceries,electricity,loan_emi,maid_help,fuel,medical,wifi_ott,phone_recharge,entertainment,shopping,miscellaneous,emg,health,life_term = inputs
    total_monthly_income = monthly_income+spouse_monthly_income
    fixed_expenses = rent+food_groceries+electricity+loan_emi+maid_help+fuel+medical
    variable_expenses = wifi_ott+phone_recharge+entertainment+shopping+miscellaneous
    expenses = fixed_expenses+variable_expenses
    savings = total_monthly_income-expenses
    debt = loan_emi
    emergency_fund = emg
    
    return total_monthly_income,fixed_expenses,debt,savings,emergency_fund,health,life_term,expenses


def calculate_ratios(summary):
    total_monthly_income,fixed_expenses,debt,savings,emergency_fund,health,life_term,expenses = summary
    fixed_expenses_ratio=(fixed_expenses/total_monthly_income)*100
    debt_ratio=(debt/total_monthly_income)*100
    savings_ratio=(savings/total_monthly_income)*100
    emergency_fund_coverage=abs(emergency_fund/expenses)
    if health == 'y':
        health_insurance = True
    else:
        health_insurance = False
    if life_term == 'y':
        life_term_insurance = True
    else:
        life_term_insurance = False
    return fixed_expenses_ratio,debt_ratio,savings_ratio,emergency_fund_coverage,health_insurance,life_term_insurance

def calculate_scores(ratios):
    protection_score=0
    fixed_expenses_ratio,debt_ratio,savings_ratio,emergency_fund_coveraga,health_insurance,life_term_insurance=ratios
    if savings_ratio >= 30:
        savings_score = 30
    elif savings_ratio >=20:
        savings_score = 24
    elif savings_ratio >=10:
        savings_score = 15
    else:
        savings_score = 5
    if debt_ratio <= 30:
        debt_score = 15
    elif debt_ratio <=40:
        debt_score = 8
    else:
        debt_score = 3
    if fixed_expenses_ratio <= 50:
        fixed_expenses_score = 25
    elif fixed_expenses_ratio <= 60:
        fixed_expenses_score = 18
    else:
        fixed_expenses_score = 10
    if health_insurance:
        protection_score += 10
    if life_term_insurance:
        protection_score += 10
    if emergency_fund_coveraga >= 6:
        protection_score += 10
    elif emergency_fund_coveraga >= 3:
        protection_score +=5
    else:
        protection_score += 0
    return savings_score,debt_score,fixed_expenses_score,protection_score

    


def evaluate_fin_health(total_score):
    savings_score,debt_score,fixed_expenses_score,protection_score = total_score
    scores = savings_score + debt_score + fixed_expenses_score + protection_score
    
    if scores >= 80:
        return "Excellent",scores
    elif scores >= 65:
        return "Good",scores
    elif scores >= 50:
        return "Average",scores
    elif scores >= 35:
        return "Weak",scores
    else:
        return "Critical",scores


def generate_swot(scores,ratios):
    fixed_expenses_ratio,debt_ratio,savings_ratio,emergency_fund_coveraga,health_insurance,life_term_insurance=ratios
    savings_score,debt_score,fixed_expenses_score,protection_score = scores
    swot = {}
    if savings_score >= 20 and fixed_expenses_ratio <= 50 and protection_score >= 20 :
        swot = {
            "Strengths" : "High Margin of Safety: Low fixed costs ($\le 50\%$) mean you can survive significant income drops without losing your home or car.",
            "Weaknesses" : "Low Growth Velocity: Over-prioritizing protection and savings often results in keeping too much cash in low-yield accounts.",
            "Opportunities" : "Aggressive Investing: Your low overhead allows you to invest in high-risk, high-reward assets (like stocks or startups) that others can't afford.",
            "Threats" : "Lifestyle Creep: Increasing your fixed expenses as your salary grows is the fastest way to destroy this model."
            }
         
    elif savings_score < 10 and debt_ratio > 40:
        swot = {
            "Strengths" : "Short-Term Purchasing Power: You are likely enjoying a higher standard of living now by leveraging future income.",
            "Weaknesses" : "Zero Room for Error: A savings score $< 10$ means you have almost no buffer for emergencies like car repairs or medical bills.",
            "Opportunities" : "Debt Consolidation: With such high debt, there is a massive opportunity to refinance or consolidate at lower rates to instantly give yourself a raise.",
            "Threats" : "The Debt Spiral: Without savings, any emergency will likely be funded by more debt, creating a cycle that is very difficult to break."
            }
     
    elif fixed_expenses_ratio > 60:
        swot = {
            "Strengths": "Asset Accumulation: High fixed costs often imply home ownership or high-quality lifestyle assets.",
            "Weaknesses": "Cash Flow Strangled: Very little 'disposable' income for spontaneity or investing.",
            "Opportunities": "Downsizing/Refinancing: A single move (cheaper car or house) could instantly solve your financial stress.",
            "Threats": "Income Volatility: Even a small 10% pay cut could make your lifestyle unsustainable."
        }

     
    elif debt_ratio > 20 and savings_score >= 20:
        swot = {
            "Strengths": "Strategic Leverage: You are using debt to grow while simultaneously building a safety net.",
            "Weaknesses": "High Monthly Pressure: You have to manage both high debt payments and high savings goals.",
            "Opportunities": "Debt Arbitrage: If your investment returns are higher than your debt interest, you are winning at wealth building.",
            "Threats": "Interest Rate Hikes: Variable debt could quickly eat into your ability to keep saving."
        }

     
    else:
        swot = {
            "Strengths": "Stability: You aren't in a crisis, and your basic needs are being met comfortably.",
            "Weaknesses": "Lack of Focus: Without a high savings score or low expenses, you are 'drifting' rather than building wealth.",
            "Opportunities": "Automation: Since you have a baseline of stability, setting up automatic 1% increases in savings is your best move.",
            "Threats": "Complacency: The biggest risk is 'coasting' until an emergency or retirement reveals the lack of growth."
        }
    return swot
    


    


def generate_actions(ratios, scores):
    fixed_expenses_ratio,debt_ratio,savings_ratio,emergency_fund_coveraga,health_insurance,life_term_insurance=ratios
    savings_score,debt_score,fixed_expenses_score,protection_score = scores
    actions={}
    stability_actions=[]
    growth_actions=[]
    survival_actions = []
    #Survival actions
    if emergency_fund_coveraga < 3 or health_insurance != True or life_term_insurance != True:
            if emergency_fund_coveraga <3:
                survival_actions.append("Build emergency fund to at least 3 months of expenses")
            if health_insurance != True:
                survival_actions.append("Get basic health insurance before any investments")
            if life_term_insurance != True:
                survival_actions.append("Consider term life insurance to protect dependents")
    else:
        pass
    #Stability actions
    if debt_ratio > 30 or fixed_expenses_ratio > 50 or savings_ratio < 20:
            if debt_ratio > 30:
                stability_actions.append("Avoid new loans and focus on debt reduction")
            if fixed_expenses_ratio > 50:
                stability_actions.append("Reduce fixed commitments (rent, EMI, subscriptions)")
            if savings_ratio < 10:
                stability_actions.append("Track expenses and cut discretionary spending first")
    else:
        pass
    #Growth actions
    if emergency_fund_coveraga >= 6 or protection_score >= 20 or savings_ratio >= 20:
            if emergency_fund_coveraga >= 6:
                growth_actions.append("Start goal-based investing")
            if protection_score >= 20:
                growth_actions.append("Increase long-term investments gradually")
            if savings_ratio >= 20:
                growth_actions.append("Review asset allocation annually")
    else:
        pass   
    for i in survival_actions:
        actions.setdefault("survival_actions",[]).append(i)
    for j in stability_actions:
        actions.setdefault("stability_actions",[]).append(j)
    for k in growth_actions:
        actions.setdefault("growth_actions",[]).append(k)
    return actions

        


         


def display_output(summary,ratios,total_score,health_score,swot,action):
    total_monthly_income,fixed_expenses,debt,savings,emergency_fund,health,life_term,expenses = summary
    fixed_expenses_ratio,debt_ratio,savings_ratio,emergency_fund_coverage,health_insurance,life_term_insurance = ratios
    health_msg,health_mark = health_score
    savings_score,debt_score,fixed_expenses_score,protection_score = total_score
    print("============================================================")
    print("******************FIN HEALTH ANALYZER v1.3******************")
    print("============================================================")
    print("\n")
    print("**********************FINANCIAL SUMMARY*********************")
    print("============================================================")
    print(f"Total Monthly Income          : ₹{total_monthly_income:.2f}")
    print(f"Total Monthly Expenses        : ₹{expenses:.2f}")
    print(f"Monthly Savings               : ₹{savings:.2f}")
    print(f"Emergency Fund Available      : ₹{emergency_fund:.2f}")
    print("\n")
    print("********************KEY FINANCIAL RATIOS********************")
    print("============================================================")
    print(f"Savings Ratio                 : {savings_ratio:.1f}%")
    print(f"Fixed Expense Ratio           : {fixed_expenses_ratio:.1f}%")
    print(f"Debt Ratio                    : {debt_ratio:.1f}%")
    print(f"Emergency Fund Coverage       : {emergency_fund_coverage:.1f} months")
    print("\n")
    print("**********************FIN HEALTH SCORE**********************")
    print("============================================================")
    print(f"Your Fin Health Score         : {health_mark}/100")
    print(f"Overall Health Status         : {health_msg}")
    print("\n")
    print("************************SWOT ANALYSIS***********************")
    print("============================================================")
    print(f"Strengths \n        * {swot["Strengths"]}")
    print("\n")
    print(f"Weaknesses \n       * {swot["Weaknesses"]}")
    print("\n")
    print(f"Opportunities \n        * {swot["Opportunities"]}")
    print("\n")
    print(f"Threats \n      * {swot["Threats"]}")
    print("********************RECOMMENDED ACTIONS*********************")
    print("============================================================")
    print(f"Survival Actions \n *{action["survival_actions"]}")
    print(f"Stability Actions \n *{action["stability_actions"]}")
    print(f"Growth Actions \n *{action["growth_actions"]}")


if __name__ == "__main__":
    main()
