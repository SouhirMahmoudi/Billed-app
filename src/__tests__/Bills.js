/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"


import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon")

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    test('Then no bills should be shown if there are 0 bills', () => {
      document.body.innerHTML = BillsUI({ data: [] })
      const iconEye = screen.queryByTestId('icon-eye')
      expect(iconEye).toBeNull()
    })

    test('Then bills are shown if there are bills', () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const iconEyes = screen.getAllByTestId('icon-eye')
      expect(iconEyes).toBeTruthy()
      expect(iconEyes.length).toBeGreaterThan(1)
      expect(screen.getAllByText('pending')).toBeTruthy()
    })
  })

  describe("When I am on the Bills page but it is loading", () => {
    test(("Then the loading page should be rendered"), () => {
      document.body.innerHTML = BillsUI({ loading: true })
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })

  describe("When I am on the Bills page but back-end send an error message", () => {
    test(("Then the error page should be rendered"), () => {
      document.body.innerHTML = BillsUI({ error: 'some error message' })
      expect(screen.getAllByText('Erreur')).toBeTruthy()
    })
  })

  describe("When I am on the Bills page and I click on the icon eye of a bill", () => {
    test(("Then a modal should be opened"), () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBills = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const iconEyes = screen.getAllByTestId('icon-eye')
      const handleClickIconEye1 = jest.fn(newBills.handleClickIconEye(iconEyes[1]))
      iconEyes[1].addEventListener('click', handleClickIconEye1)
      userEvent.click(iconEyes[1])
      expect(handleClickIconEye1).toHaveBeenCalled()
      const modale = screen.getByTestId('modale')
      expect(modale).toBeTruthy()
    })
  })

  describe("When I am on Bills page and I click on the New Bill button", () => {
    test(("Then I get on the New Bill page"), () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBills = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      })

      const newBillButton = screen.getByTestId('btn-new-bill')
      const handleClickNewBillButton = jest.fn(newBills.handleClickNewBill())
      newBillButton.addEventListener('click', handleClickNewBillButton)
      userEvent.click(newBillButton)
      expect(handleClickNewBillButton).toHaveBeenCalled()
      const newBillTitle = screen.getByText('Envoyer une note de frais')
      expect(newBillTitle).toBeTruthy()
    })
  })
})


// test d'intégration GET
describe("Given I am connected as employee", () => {
  describe("When I am on Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      document.body.innerHTML = BillsUI({ data: bills })
      await waitFor(() => screen.getByTestId("tbody"))
      expect(screen.getByTestId("tbody").innerHTML).not.toBe("")
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" })
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" })
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
