import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import Upload from "./Upload"

describe("Upload Component", () => {
    it("renders upload progress container", () => {
        const { container } = render(<Upload fileName="test.txt" value={0} />)

        const uploadContainer = container.querySelector(".fixed")
        expect(uploadContainer).toBeInTheDocument()
        expect(uploadContainer).toHaveClass("bottom-6", "right-6", "z-50")
    })

    it("displays file name", () => {
        render(<Upload fileName="document.pdf" value={50} />)

        expect(screen.getByText("document.pdf")).toBeInTheDocument()
    })

    it("displays progress percentage", () => {
        render(<Upload fileName="test.txt" value={75} />)

        expect(screen.getByText("75%")).toBeInTheDocument()
    })

    it("updates progress percentage when value changes", () => {
        const { rerender } = render(<Upload fileName="test.txt" value={25} />)

        expect(screen.getByText("25%")).toBeInTheDocument()

        rerender(<Upload fileName="test.txt" value={50} />)

        expect(screen.getByText("50%")).toBeInTheDocument()

        rerender(<Upload fileName="test.txt" value={100} />)

        expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("displays zero percent when progress is 0", () => {
        render(<Upload fileName="test.txt" value={0} />)

        expect(screen.getByText("0%")).toBeInTheDocument()
    })

    it("displays 100 percent when upload is complete", () => {
        render(<Upload fileName="test.txt" value={100} />)

        expect(screen.getByText("100%")).toBeInTheDocument()
    })

    it("renders with correct styling classes", () => {
        const { container } = render(<Upload fileName="test.txt" value={50} />)

        const uploadDiv = container.querySelector(".fixed")
        expect(uploadDiv).toHaveClass(
            "bg-zinc-900",
            "text-white",
            "rounded-xl",
            "shadow-2xl",
            "p-4",
            "border",
            "border-zinc-800"
        )
    })

    it("includes animation classes for appearance", () => {
        const { container } = render(<Upload fileName="test.txt" value={50} />)

        const uploadDiv = container.querySelector(".fixed")
        expect(uploadDiv).toHaveClass("animate-in", "fade-in", "slide-in-from-bottom-4")
    })

    it("truncates long file names", () => {
        const longFileName = "very_long_file_name_that_should_be_truncated_somewhere.pdf"
        render(<Upload fileName={longFileName} value={50} />)

        const fileNameElement = screen.getByText(longFileName)
        expect(fileNameElement).toHaveClass("truncate")
    })

    it("displays progress bar component", () => {
        const { container } = render(<Upload fileName="test.txt" value={50} />)

        // Progress component typically uses a progress element or progress bar
        const progressElement = container.querySelector('[role="progressbar"]') || 
                              container.querySelector('.h-2')
        expect(progressElement || container.querySelector('*[class*="progress"]')).toBeInTheDocument()
    })

    it("handles various file types", () => {
        const fileTypes = [
            "image.jpg",
            "video.mp4",
            "document.pdf",
            "archive.zip",
            "spreadsheet.xlsx",
        ]

        fileTypes.forEach((fileName) => {
            const { unmount } = render(<Upload fileName={fileName} value={50} />)
            expect(screen.getByText(fileName)).toBeInTheDocument()
            unmount()
        })
    })
})
