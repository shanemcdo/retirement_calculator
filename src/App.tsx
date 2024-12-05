import type { Component, Ref } from 'solid-js';

import { createSignal, onMount, createUniqueId, Show, createEffect } from 'solid-js';
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
	defaultValue: number,
	name: string,
	ref: Ref<HTMLInputElement>,
	updateData: () => void,
	disabled?: boolean,
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

function calculateRetirementAge(
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number,
	safeWithdrawlRate: number,
): number {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const requiredNestEgg = spendingPerYear / safeWithdrawlRate * 100;
	while(currentAge <= maxAge) {
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentBalance < requiredNestEgg) {
				currentBalance += currentInvestmentPerMonth;
			} else {
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
	return <>
		<label for={id} >{ props.name }:</label>
		<input
			type="number"
			value={getURLParam(props.name) ?? props.defaultValue}
			class={styles.number_input}
			ref={props.ref}
			id={id}
			disabled={props.disabled ?? false}
			onChange={(e) => {
				if(e.target.valueAsNumber === props.defaultValue) {
					deleteURLParam(props.name);
				} else {
					setURLParam(props.name, e.target.value);
				}
				props.updateData();
			}}
		/>
	</>;
}

const App: Component = () => {
	const [data, setData] = createSignal<Data>([]);
	let startingAgeInput: HTMLInputElement | undefined;
	let startingBalanceInput: HTMLInputElement | undefined;
	let interestRateInput: HTMLInputElement | undefined;
	let retirementAgeInput: HTMLInputElement | undefined;
	let maxAgeInput: HTMLInputElement | undefined;
	let startingInvestmentPerMonthInput: HTMLInputElement | undefined;
	let investmentIncreasingRateInput: HTMLInputElement | undefined;
	let spendingPerYearInput: HTMLInputElement | undefined;
	let safeWithdrawlRateInput: HTMLInputElement | undefined;
	let hiddenDatasets = getHiddenDatasetsFromURLParam();
	const [useSafeWithdrawlRate, setUseSafeWithdrawlRate] = createSignal(getURLParam('useSafeWithdrawlRate') !== null);
	const toggleUseSafeWithdrawlRate = () => setUseSafeWithdrawlRate(!useSafeWithdrawlRate());
	createEffect(() => {
		if(useSafeWithdrawlRate()) {
			setURLParam('useSafeWithdrawlRate', '0');
		} else {
			deleteURLParam('useSafeWithdrawlRate');
		}
		updateData();
	});
	const updateWithoutSafeWithdrawl = () => {
		setData(calculateData(
			startingAgeInput!.valueAsNumber,
			startingBalanceInput!.valueAsNumber,
			interestRateInput!.valueAsNumber,
			retirementAgeInput!.valueAsNumber,
			maxAgeInput!.valueAsNumber,
			startingInvestmentPerMonthInput!.valueAsNumber,
			investmentIncreasingRateInput!.valueAsNumber,
			spendingPerYearInput!.valueAsNumber,
		));
	};
	const updateWithSafeWithdrawl = () => {
		retirementAgeInput!.value = calculateRetirementAge(
			startingAgeInput!.valueAsNumber,
			startingBalanceInput!.valueAsNumber,
			interestRateInput!.valueAsNumber,
			maxAgeInput!.valueAsNumber,
			startingInvestmentPerMonthInput!.valueAsNumber,
			investmentIncreasingRateInput!.valueAsNumber,
			spendingPerYearInput!.valueAsNumber,
			safeWithdrawlRateInput!.valueAsNumber
		).toString();
		retirementAgeInput!.dispatchEvent(new Event('change'));
	};
	const updateData = () => {
		if(useSafeWithdrawlRate()) {
			updateWithSafeWithdrawl();
		} else {
			updateWithoutSafeWithdrawl();
		}
	};
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
		updateData();
	});
	const chartData = () => ({
		labels: data().map(({ year }) => year),
		datasets: [
			{
				label: 'Retirement Fund',
				data: data().map(({ value }) => value),
				hidden: hiddenDatasets[0] ?? false,
			},
			{
				label: 'Principal',
				data: data().map(({ principal }) => principal),
				hidden: hiddenDatasets[1] ?? false,
			},
			{
				label: 'Interest Per Year',
				data: data().map(({ interestPerYear }) => interestPerYear),
				hidden: hiddenDatasets[2] ?? false,
			},
			{
				label: 'Total Interest',
				data: data().map(({ totalInterest }) => totalInterest),
				hidden: hiddenDatasets[3] ?? false,
			},
			{
				label: 'Spending',
				data: data().map(({ spending }) => spending),
				hidden: hiddenDatasets[4] ?? false,
			},
		],
	});
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
			<NumberInput name="Starting age"                   defaultValue={22}      ref={startingAgeInput}                updateData={updateData} />
			<NumberInput name="Starting Balance"               defaultValue={0}       ref={startingBalanceInput}            updateData={updateData} />
			<NumberInput name="Interest Rate (%)"              defaultValue={10}      ref={interestRateInput}               updateData={updateData} />
			<NumberInput name="Retirement Age"                 defaultValue={50}      ref={retirementAgeInput}              updateData={updateWithoutSafeWithdrawl} disabled={useSafeWithdrawlRate()} />
			<NumberInput name="Max Age"                        defaultValue={120}     ref={maxAgeInput}                     updateData={updateData} />
			<NumberInput name="Starting Investment Per Month"  defaultValue={500}     ref={startingInvestmentPerMonthInput} updateData={updateData} />
			<NumberInput name="Investment Increasing Rate (%)" defaultValue={1}       ref={investmentIncreasingRateInput}   updateData={updateData} />
			<NumberInput name="Spending Per Year Input"        defaultValue={100_000} ref={spendingPerYearInput}            updateData={updateData} />
			<Show when={useSafeWithdrawlRate()}>
				<NumberInput
					name="Safe Withdrawl Rate (%)"
					defaultValue={4}
					ref={safeWithdrawlRateInput}
					updateData={updateWithSafeWithdrawl}
				/>
			</Show>
		</div>
		<div>
			<button
				onclick={toggleUseSafeWithdrawlRate}
			>{useSafeWithdrawlRate() ? "Don't Use Safe Withdrawl Rate" : "Use Safe Withdrawl Rate"}</button>
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
