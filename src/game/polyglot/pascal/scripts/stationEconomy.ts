/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Pascal source for Periphery-9 Station Economy & Oxygen Debt Calculation
// Executed via the built-in Pascal Interpreter.

export const STATION_ECONOMY_PAS = `
PROGRAM StationEconomy;

VAR
  ReputationCorp: INTEGER;
  ReputationSyndicate: INTEGER;
  BasePrice: INTEGER;
  VendorPrice: INTEGER;
  OxygenDebtTariff: INTEGER;
  DebtAccrued: INTEGER;
  HasVIPAccess: BOOLEAN;

BEGIN
  { Calculate vendor price based on Syndicate and Corp standing }
  IF ReputationSyndicate > 30 THEN
    VendorPrice := BasePrice - (BasePrice * 20 DIV 100)
  ELSE IF ReputationCorp > 40 THEN
    VendorPrice := BasePrice - (BasePrice * 15 DIV 100)
  ELSE IF ReputationCorp < -30 THEN
    VendorPrice := BasePrice + (BasePrice * 25 DIV 100)
  ELSE
    VendorPrice := BasePrice;

  { Calculate Oxygen tariff per billing cycle }
  IF HasVIPAccess THEN
    OxygenDebtTariff := 0
  ELSE IF ReputationCorp > 50 THEN
    OxygenDebtTariff := 5
  ELSE IF ReputationSyndicate > 50 THEN
    OxygenDebtTariff := 15
  ELSE
    OxygenDebtTariff := 25;

  DebtAccrued := OxygenDebtTariff;
END.
`;

export const QUEST_BRANCHING_PAS = `
PROGRAM QuestConsequences;

VAR
  ChosenOutcome: STRING;
  SyndicateRepDelta: INTEGER;
  CorpRepDelta: INTEGER;
  SmugglerRepDelta: INTEGER;
  OxygenRestored: BOOLEAN;
  StationAlarmActive: BOOLEAN;

BEGIN
  IF ChosenOutcome = 'corp' THEN
  BEGIN
    CorpRepDelta := 60;
    SyndicateRepDelta := -80;
    SmugglerRepDelta := -20;
    OxygenRestored := TRUE;
    StationAlarmActive := FALSE;
  END
  ELSE IF ChosenOutcome = 'syndicate' THEN
  BEGIN
    CorpRepDelta := -90;
    SyndicateRepDelta := 80;
    SmugglerRepDelta := 30;
    OxygenRestored := TRUE;
    StationAlarmActive := TRUE;
  END
  ELSE
  BEGIN
    CorpRepDelta := -15;
    SyndicateRepDelta := 20;
    SmugglerRepDelta := 75;
    OxygenRestored := TRUE;
    StationAlarmActive := FALSE;
  END;
END.
`;
