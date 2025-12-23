import type { Component } from 'solid-js';

import { createSignal, onMount, createEffect } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors } from 'chart.js'
import { Line } from 'solid-chartjs'
import { deleteURLParam, getURLParam, setURLParam } from './util';
import NumberInput from './NumberInput';

import styles from './App.module.css';

function calculateData(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number,
): Data {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	let principal = startingBalance;
	let interestPerYear = 0;
	let totalInterest = 0;
	let spending = 0;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const monthlySpending = spendingPerYear / 12;
	const data: Data = [];
	while(currentAge <= maxAge) {
		data.push({
			year: currentAge,
			value: currentBalance,
			principal,
			totalInterest,
			spending,
			interestPerYear,
		});
		interestPerYear = 0;
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentAge < retirementAge) {
				principal += currentInvestmentPerMonth;
				currentBalance += currentInvestmentPerMonth;
			} else {
				spending += monthlySpending;
				currentBalance -= monthlySpending;
			}
			const interestPerMonth = currentBalance * monthlyInterestRate;
			interestPerYear += interestPerMonth;
			totalInterest += interestPerMonth;
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
		currentAge += 1;
	}
	return data;
}

function calculateWithdrawlRate(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number,
): number {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const monthlySpending = spendingPerYear / 12;
	while(currentAge <= maxAge) {
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentAge < retirementAge) {
				currentBalance += currentInvestmentPerMonth;
			} else {
				return Math.round(spendingPerYear / currentBalance * 10000) / 100;
				currentBalance -= monthlySpending;
			}
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
		currentAge += 1;
	}
	return currentAge;
}

function calculateRetirementAge(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number,
	withdrawlRate: number,
): number {
	console.count('retirement age');
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const requiredNestEgg = spendingPerYear / withdrawlRate * 100;
	while(currentAge <= maxAge) {
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentBalance < requiredNestEgg) {
				currentBalance += currentInvestmentPerMonth;
			} else {
				console.table({currentBalance, requiredNestEgg, currentAge});
				return currentAge;
			}
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
		currentAge += 1;
	}
	return currentAge;
}

function calculateInvestmentPerMonth(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	retirementAge: number,
	maxAge: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number,
	withdrawlRate: number,
): number {
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const requiredNestEgg = spendingPerYear / withdrawlRate * 100;
	const step = 50;
	for (let startingInvestmentPerMonth = step;startingAge <= maxAge && startingAge <= retirementAge;startingInvestmentPerMonth += step){
		let currentAge = startingAge;
		let currentBalance = startingBalance;
		let currentInvestmentPerMonth = startingInvestmentPerMonth;
		while(currentAge <= maxAge && currentAge <= retirementAge && currentBalance >= 0) {
			for(let i = 0; i < 12; i++) {
				if(currentBalance < requiredNestEgg) {
					currentBalance += currentInvestmentPerMonth;
				} else {
					return startingInvestmentPerMonth;
				}
				currentBalance *= 1 + monthlyInterestRate;
			};
			currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
			currentAge += 1;
		}
	}
	return 1000;
}

export function addHiddenDatasetsURLParam(hiddenDatasets: boolean[]) {
	let result = '';
	for(let i = 0; i < hiddenDatasets.length; i++) {
		if(!hiddenDatasets[i]) {
			continue;
		} else if(result !== '') {
			result += ',';
		}
		result += i.toString();
	};
	setURLParam('hiddenDatasets', result);
}

function getHiddenDatasetsFromURLParam(): boolean[] {
	const result: boolean[] = [];
	getURLParam('hiddenDatasets')
		?.split(',')
		.map(x => parseInt(x))
		.forEach( index => {
			result[index] = true;
		});
	return result;
}

const App: Component = () => {
	const defaultValues = {
		startingAge: 20,
		startingBalance: 0,
		interestRate: 7,
		retirementAge: 60,
		maxAge: 120,
		startingInvestmentPerMonth: 750,
		investmentIncreasingRate: 0,
		spendingPerYear: 100_000,
		withdrawlRate: 5.05,
		disabledField: 'Withdrawl Rate (%)',
	}
	const inputSignals = {
		startingAge: createSignal(defaultValues.startingAge),
		startingBalance: createSignal(defaultValues.startingBalance),
		interestRate: createSignal(defaultValues.interestRate),
		retirementAge: createSignal(defaultValues.retirementAge),
		maxAge: createSignal(defaultValues.maxAge),
		startingInvestmentPerMonth: createSignal(defaultValues.startingInvestmentPerMonth),
		investmentIncreasingRate: createSignal(defaultValues.investmentIncreasingRate),
		spendingPerYear: createSignal(defaultValues.spendingPerYear),
		withdrawlRate: createSignal(defaultValues.withdrawlRate),
	}
	const disabledFieldSignal = createSignal(getURLParam('disabledField') ?? defaultValues.disabledField);
	const [disabledField, setDisabledField] = disabledFieldSignal;
	let hiddenDatasets = getHiddenDatasetsFromURLParam();
	onMount(() => {
		Chart.register(Title, Tooltip, Legend, Colors);
		Chart.defaults.font.family = '"Josefin Sans", sans-serif';
		document.addEventListener('click', () => {
			setTimeout(() =>{
				const chart = Chart.getChart(document.querySelector('canvas')!)!;
				hiddenDatasets = chart?.legend?.legendItems?.map(({ hidden }) => hidden ?? false) ?? []
				addHiddenDatasetsURLParam(hiddenDatasets);
			}, 100);
		});
	});
	createEffect(() => {
		if(disabledField() === defaultValues.disabledField) {
			deleteURLParam('disabledField');
		} else {
			setURLParam('disabledField', disabledField());
		}
	});
	createEffect(() => {
		switch(disabledField()) {
			case 'Retirement Age':
				inputSignals.retirementAge[1](calculateRetirementAge(
					inputSignals.startingAge[0](),
					inputSignals.startingBalance[0](),
					inputSignals.interestRate[0](),
					inputSignals.maxAge[0](),
					inputSignals.startingInvestmentPerMonth[0](),
					inputSignals.investmentIncreasingRate[0](),
					inputSignals.spendingPerYear[0](),
					inputSignals.withdrawlRate[0](),
				))
				break;
			case 'Withdrawl Rate (%)':
				inputSignals.withdrawlRate[1](calculateWithdrawlRate(
					inputSignals.startingAge[0](),
					inputSignals.startingBalance[0](),
					inputSignals.interestRate[0](),
					inputSignals.retirementAge[0](),
					inputSignals.maxAge[0](),
					inputSignals.startingInvestmentPerMonth[0](),
					inputSignals.investmentIncreasingRate[0](),
					inputSignals.spendingPerYear[0](),
				))
				break;
			case 'Starting Investment Per Month':
				inputSignals.startingInvestmentPerMonth[1](calculateInvestmentPerMonth(
					inputSignals.startingAge[0](),
					inputSignals.startingBalance[0](),
					inputSignals.interestRate[0](),
					inputSignals.retirementAge[0](),
					inputSignals.maxAge[0](),
					inputSignals.investmentIncreasingRate[0](),
					inputSignals.spendingPerYear[0](),
					inputSignals.withdrawlRate[0](),
				))
				break;
			default:
				setDisabledField(defaultValues.disabledField);
		}
	});
	// TODO: this gets called twice on every change. Fix that
	const chartData = () => { 
		console.count('chartData');
		const data = calculateData(
			inputSignals.startingAge[0](),
			inputSignals.startingBalance[0](),
			inputSignals.interestRate[0](),
			inputSignals.retirementAge[0](),
			inputSignals.maxAge[0](),
			inputSignals.startingInvestmentPerMonth[0](),
			inputSignals.investmentIncreasingRate[0](),
			inputSignals.spendingPerYear[0](),
		);
		return {
			labels: data.map(({ year }) => year),
			datasets: [
				{
					label: 'Retirement Fund',
					data: data.map(({ value }) => value),
					hidden: hiddenDatasets[0] ?? false,
				},
				{
					label: 'Principal',
					data: data.map(({ principal }) => principal),
					hidden: hiddenDatasets[1] ?? false,
				},
				{
					label: 'Interest Per Year',
					data: data.map(({ interestPerYear }) => interestPerYear),
					hidden: hiddenDatasets[2] ?? false,
				},
				{
					label: 'Total Interest',
					data: data.map(({ totalInterest }) => totalInterest),
					hidden: hiddenDatasets[3] ?? false,
				},
				{
					label: 'Spending',
					data: data.map(({ spending }) => spending),
					hidden: hiddenDatasets[4] ?? false,
				},
			],
		};
	};
	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		animation: {
			duration: 0,
		},
		scales: {
			y: { 
				min: 0,
			},
		},
	};
	return <div class={styles.app}>
		<h1>Retirement Calculator</h1>
		<div class={styles.grid}>
			<NumberInput name="Starting age"                   defaultValue={defaultValues.startingAge}                valueSignal={inputSignals.startingAge}                                                                     />
			<NumberInput name="Starting Balance"               defaultValue={defaultValues.startingBalance}            valueSignal={inputSignals.startingBalance}            step={500}                                           />
			<NumberInput name="Interest Rate (%)"              defaultValue={defaultValues.interestRate}               valueSignal={inputSignals.interestRate}               step={0.5}                                           />
			<NumberInput name="Retirement Age"                 defaultValue={defaultValues.retirementAge}              valueSignal={inputSignals.retirementAge}                         disabledFieldSignal={disabledFieldSignal} />
			<NumberInput name="Max Age"                        defaultValue={defaultValues.maxAge}                     valueSignal={inputSignals.maxAge}                     step={5}                                             />
			<NumberInput name="Starting Investment Per Month"  defaultValue={defaultValues.startingInvestmentPerMonth} valueSignal={inputSignals.startingInvestmentPerMonth} step={50}  disabledFieldSignal={disabledFieldSignal} />
			<NumberInput name="Investment Increasing Rate (%)" defaultValue={defaultValues.investmentIncreasingRate}   valueSignal={inputSignals.investmentIncreasingRate}   step={0.5}                                           />
			<NumberInput name="Spending Per Year Input"        defaultValue={defaultValues.spendingPerYear}            valueSignal={inputSignals.spendingPerYear}            step={1000}                                          />
			<NumberInput name="Withdrawl Rate (%)"             defaultValue={defaultValues.withdrawlRate}              valueSignal={inputSignals.withdrawlRate}              step={0.5} disabledFieldSignal={disabledFieldSignal} />
		</div>
		<div>
			<button
				onclick={() => location.href = './'}
			>Reset</button>
		</div>
		<div class={styles.chart_container} >
			<Line
				data={chartData()}
				options={chartOptions}
				onclick={() => {
				}}
			/>
		</div>
	</div>;
};

export default App;
