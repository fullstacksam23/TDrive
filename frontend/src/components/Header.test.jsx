import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Header } from "./Header"

describe("Header Component", () => {
    it("renders search input and view toggle buttons", () => {
        const mockSetSearchQuery = vi.fn()
        const mockSetView = vi.fn()

        render(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="list"
                setView={mockSetView}
            />
        )

        expect(screen.getByPlaceholderText("Search in TDrive...")).toBeInTheDocument()
        expect(screen.getByLabelText("List view")).toBeInTheDocument()
        expect(screen.getByLabelText("Grid view")).toBeInTheDocument()
    })

    it("highlights the active view button", () => {
        const mockSetSearchQuery = vi.fn()
        const mockSetView = vi.fn()

        const { rerender } = render(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="list"
                setView={mockSetView}
            />
        )

        const listBtn = screen.getByLabelText("List view")
        const gridBtn = screen.getByLabelText("Grid view")

        expect(listBtn).toHaveAttribute("data-variant", "secondary")
        expect(gridBtn).toHaveAttribute("data-variant", "ghost")

        rerender(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="grid"
                setView={mockSetView}
            />
        )

        expect(listBtn).toHaveAttribute("data-variant", "ghost")
        expect(gridBtn).toHaveAttribute("data-variant", "secondary")
    })

    it("calls setView when view toggle buttons are clicked", async () => {
        const mockSetSearchQuery = vi.fn()
        const mockSetView = vi.fn()

        render(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="list"
                setView={mockSetView}
            />
        )

        const gridBtn = screen.getByLabelText("Grid view")
        fireEvent.click(gridBtn)

        expect(mockSetView).toHaveBeenCalledWith("grid")
    })

    it("debounces search query updates", async () => {
        const mockSetSearchQuery = vi.fn()
        const mockSetView = vi.fn()

        render(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="list"
                setView={mockSetView}
            />
        )

        const searchInput = screen.getByPlaceholderText("Search in TDrive...")

        fireEvent.change(searchInput, { target: { value: "test" } })
        expect(mockSetSearchQuery).not.toHaveBeenCalled()

        fireEvent.change(searchInput, { target: { value: "testing" } })
        expect(mockSetSearchQuery).not.toHaveBeenCalled()

        await waitFor(() => {
            expect(mockSetSearchQuery).toHaveBeenCalledWith("testing")
        }, { timeout: 500 })
    })

    it("trims whitespace from search query", async () => {
        const mockSetSearchQuery = vi.fn()
        const mockSetView = vi.fn()

        render(
            <Header
                setSearchQuery={mockSetSearchQuery}
                view="list"
                setView={mockSetView}
            />
        )

        const searchInput = screen.getByPlaceholderText("Search in TDrive...")
        fireEvent.change(searchInput, { target: { value: "  test  " } })

        await waitFor(() => {
            expect(mockSetSearchQuery).toHaveBeenCalledWith("test")
        }, { timeout: 500 })
    })
})
