package mainincubator.controller;

import mainincubator.exception.ResourceNotFoundException;
import mainincubator.model.CoreInstruments;
import mainincubator.repository.CoreInstrumentsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

@RestController
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @GetMapping("/coreinstruments")
    public Page<Question> getQuestions(Pageable pageable) {
        return questionRepository.findAll(pageable);
    }


    @PostMapping("/coreinstruments")
    public CoreInstruments createCoreInstruments(@Valid @RequestBody Question instrument) {
        return CoreInstrumentsRepository.save(instrument);
    }

    @PutMapping("/coreinstruments/{coreinstrumentsId}")
    public Question updateQuestion(@PathVariable Long coreinstrumentsId,
                                   @Valid @RequestBody Question instrumentRequest) {
        return CoreInstruments.findById(coreinstrumentsId)
                .map(question -> {
                    question.setTitle(instrumentRequest.getTitle());
                    question.setDescription(instrumentRequest.getDescription());
                    return CoreInstruments.save(question);
                }).orElseThrow(() -> new ResourceNotFoundException("Question not found with id " + coreinstrumentsId));
    }


    @DeleteMapping("/coreinstruments/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long questionId) {
        return CoreInstruments.findById(questionId)
                .map(question -> {
                    CoreInstruments.delete(question);
                    return ResponseEntity.ok().build();
                }).orElseThrow(() -> new ResourceNotFoundException("Question not found with id " + questionId));
    }
}
