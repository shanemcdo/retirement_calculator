import type { Component, Signal } from 'solid-js';

import { createSignal, onMount, createUniqueId, createEffect, untrack } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors } from 'chart.js'
import { Line } from 'solid-chartjs'
import styles from './App.module.css';

type Data = {
	year: number,
	value: number,
	principal: number,
	totalInterest: number,
	spending: number,
	interestPerYear: number,
}[];

type NumberInputProps = {
	name: string,
	valueSignal: Signal<number>,
	defaultValue?: number,
	disabled?: boolean,
	step?: number,
};

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
			interestPerYear = currentBalance * monthlyInterestRate;
			totalInterest += interestPerYear;
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

function getURL(): URL {
	return new URL(window.location.toString());
}

function updateURL(newurl: URL) {
	const urlstring = newurl.toString();
	window.history.pushState({ path: urlstring },'',urlstring);
}

function setURLParam(name: string, value: string) {
	if(value === '') {
		deleteURLParam(name);
		return;
	}
	const url = getURL();
	url.searchParams.set(name, value);
	updateURL(url);
}

function deleteURLParam(name: string) {
	const url = getURL();
	url.searchParams.delete(name);
	updateURL(url);
}

function getURLParam(name: string): string | null {
	const url = getURL();
	return url.searchParams.get(name);
}

function addHiddenDatasetsURLParam(hiddenDatasets: boolean[]) {
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

const NumberInput: Component<NumberInputProps> = props => {
	const id = createUniqueId();
	const [value, setValue] = props.valueSignal;
	const param = getURLParam(props.name);
	if(param !== null) {
		setValue(parseFloat(param));
	}
	createEffect(() => {
		if(props.defaultValue === value()) {
			deleteURLParam(props.name);
		} else {
			setURLParam(props.name, value().toString());
		}
	})
	return <>
		<label for={id} >{ props.name }:</label>
		<input
			type="number"
			value={value()}
			class={styles.number_input}
			id={id}
			step={props.step}
			disabled={props.disabled ?? false}
			onChange={(e) => {
				setValue(e.target.valueAsNumber);
			}}
		/>
	</>;
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
	const [useWithdrawlRate, setUseWithdrawlRate] = createSignal(getURLParam('useWithdrawlRate') !== null);
	const toggleUseWithdrawlRate = () => setUseWithdrawlRate(!useWithdrawlRate());
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
		if(useWithdrawlRate()) {
			setURLParam('useWithdrawlRate', '0');
		} else {
			deleteURLParam('useWithdrawlRate');
		}
	});
	createEffect(() => {
		if(useWithdrawlRate()) {
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
		} else {
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
			<NumberInput name="Starting age"                   defaultValue={defaultValues.startingAge}                valueSignal={inputSignals.startingAge}                                                          />
			<NumberInput name="Starting Balance"               defaultValue={defaultValues.startingBalance}            valueSignal={inputSignals.startingBalance}            step={500}                                />
			<NumberInput name="Interest Rate (%)"              defaultValue={defaultValues.interestRate}               valueSignal={inputSignals.interestRate}               step={0.5}                                />
			<NumberInput name="Retirement Age"                 defaultValue={defaultValues.retirementAge}              valueSignal={inputSignals.retirementAge}                         disabled={useWithdrawlRate()}  />
			<NumberInput name="Max Age"                        defaultValue={defaultValues.maxAge}                     valueSignal={inputSignals.maxAge}                     step={5}                                  />
			<NumberInput name="Starting Investment Per Month"  defaultValue={defaultValues.startingInvestmentPerMonth} valueSignal={inputSignals.startingInvestmentPerMonth} step={50}                                 />
			<NumberInput name="Investment Increasing Rate (%)" defaultValue={defaultValues.investmentIncreasingRate}   valueSignal={inputSignals.investmentIncreasingRate}   step={0.5}                                />
			<NumberInput name="Spending Per Year Input"        defaultValue={defaultValues.spendingPerYear}            valueSignal={inputSignals.spendingPerYear}            step={1000}                               />
			<NumberInput name="Withdrawl Rate (%)"             defaultValue={defaultValues.withdrawlRate}              valueSignal={inputSignals.withdrawlRate}              step={0.5} disabled={!useWithdrawlRate()} />
		</div>
		<div>
			<input
				type="checkbox"
				id="useWithdrawlRate"
				onclick={e => setUseWithdrawlRate((e.target as HTMLInputElement).checked)}
				checked={useWithdrawlRate()}
			/>
			<label for="useWithdrawlRate">Use Withdrawl Rate</label>
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
