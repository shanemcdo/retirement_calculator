import type { Component, Ref } from 'solid-js';

import { createSignal, createEffect, onMount } from 'solid-js';
import styles from './App.module.css';

const MAX_AGE = 200;

type Data = {
	year: number,
	value: number,
}[];

type NumberInputProps = {
	value: number,
	name: string,
	ref: Ref<HTMLInputElement>
};

function calculateData(
	startingAge: number,
	startingBalance: number,
	interestRate: number,
	retirementAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRate: number,
	spendingPerYear: number
): Data {
	console.table({
	startingAge,
	startingBalance,
	interestRate,
	retirementAge,
	startingInvestmentPerMonth,
	investmentIncreasingRate,
	spendingPerYear
	});
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	const monthlyInterestRate = interestRate / 12;
	const data: Data = [];
	const pushData = () => data.push({ year: currentAge, value: currentBalance });
	while(currentAge < retirementAge) {
		pushData();
		currentAge += 1;
		for(let i = 0; i < 12; i++) {
			currentBalance += currentInvestmentPerMonth;
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRate;
	}
	while(currentAge < MAX_AGE && currentBalance > 0) {
		pushData();
		currentAge += 1;
	}
	return data;
}

const NumberInput: Component<NumberInputProps> = props => <>
		<label>{ props.name }</label>
		<input
			type="number"
			value={props.value}
			class={styles.number_input}
			ref={props.ref}
		/>
	</>

const App: Component = () => {
	const [data, setData] = createSignal<Data>([]);
	let startingAgeInput: HTMLInputElement | undefined;
	let startingBalanceInput: HTMLInputElement | undefined;
	let interestRateInput: HTMLInputElement | undefined;
	let retirementAgeInput: HTMLInputElement | undefined;
	let startingInvestmentPerMonthInput: HTMLInputElement | undefined;
	let investmentIncreasingRateInput: HTMLInputElement | undefined;
	let spendingPerYearInput: HTMLInputElement | undefined;
	const updateData = () => {
		setData(calculateData(
			startingAgeInput!.valueAsNumber,
			startingBalanceInput!.valueAsNumber,
			interestRateInput!.valueAsNumber,
			retirementAgeInput!.valueAsNumber,
			startingInvestmentPerMonthInput!.valueAsNumber,
			investmentIncreasingRateInput!.valueAsNumber,
			spendingPerYearInput!.valueAsNumber,
		));
	}
	onMount(updateData);
	createEffect(() => console.log(data()));
	return <div class={styles.app}>
		<h1>Retirement Calculator</h1>
		<div class={styles.grid}>
			<NumberInput name="Starting age:"                  value={22}      ref={startingAgeInput} />
			<NumberInput name="Starting Balance:"              value={10000}   ref={startingBalanceInput} />
			<NumberInput name="Interest Rate:"                 value={0.10}    ref={interestRateInput} />
			<NumberInput name="Retirement Age:"                value={60}      ref={retirementAgeInput} />
			<NumberInput name="Starting Investment Per Month:" value={500}     ref={startingInvestmentPerMonthInput} />
			<NumberInput name="Investment Increasing Rate:"    value={0.01}    ref={investmentIncreasingRateInput} />
			<NumberInput name="Spending Per Year Input:"       value={100_000} ref={spendingPerYearInput} />
		</div>
	</div>;
};

export default App;
